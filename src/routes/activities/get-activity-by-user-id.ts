import joi = require('joi');

import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';

import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { GetUserActivityResponseSchema } from '../../lib/route-schemas/user.schema';
import { getDB } from '../../lib/db';
import { Prisma } from '.prisma/client';
import { CLIENT, STAKEHOLDER_GROUP_ROLES as stk, WORKFLOW_USER_ROLES } from '../../lib/constants';
import { CaseActivityLogTypes } from '../../lib/types-and-interfaces';

export const routeSchema: RouteSchema = {
  params: { userId: joi.string().required() },
  query: {
    skip: joi.number().min(0).default(0),
    take: joi.number().min(10).default(20),
    caseId: joi.string().uuid().allow(''),
    caseName: joi.string().allow(''),
    caseType: joi.string().valid('HPD', 'PATH'),
    from: joi.date(),
    to: joi.date(),
    search: joi.string(),
    activityType: joi.string(),
  },
  responseBody: GetUserActivityResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const jwt: CognitoJwtType = input.routeData.jwt;

  const db = getDB();

  const user = await getUserByEmail(jwt?.email);
  const isHpdUser = user.StakeholderGroupRoles.some(r =>
    WORKFLOW_USER_ROLES.HPD.map(r => r.toString()).includes(r.StakeholderGroupRole?.Name || ''),
  );
  const isPathUser = user.StakeholderGroupRoles.some(r =>
    WORKFLOW_USER_ROLES.PATH.map(r => r.toString()).includes(r.StakeholderGroupRole?.Name || ''),
  );

  const { userId } = input.params as { userId: string };

  const query = input.query as {
    skip: number;
    take: number;
    caseName: string;
    caseId: string;
    activityType: string;
    from: Date;
    to: Date;
    search: string;
    caseType: 'HPD' | 'PATH' | undefined;
  };
  query.caseType = isHpdUser ? 'HPD' : isPathUser ? 'PATH' : undefined;
  const activityTypeFilter = query.activityType
    .replace(/(\r\n|\n|\r)/gm, '')
    .split(',')
    .map(item => item.trim());

  /**
   * Can user read users
   */

  const userGroups = await db.user_StakeholderGroupRole.findMany({
    where: {
      UserId: user.id,
    },
    include: {
      StakeholderGroupRole: true,
    },
  });

  const admittedGroups = [
    stk.DHS_ADMIN,
    stk.DHS_AGENT,
    stk.HPD_ADMIN,
    stk.HPD_AGENT,
    stk.PATH_AGENT,
    stk.PATH_ADMIN,
    stk.PLATFORM_ADMIN,
    stk.CBO_STAFFER,
    stk.CBO_SUPERVISOR,
    stk.SPONSOR,
  ];

  const canViewUser = userGroups.some(ele => admittedGroups.includes(ele.StakeholderGroupRole?.Name ?? ('' as any)));

  if (!canViewUser) {
    throw new CustomError(JSON.stringify({ message: 'User does not have permission to view users activities' }), 400);
  }

  const activityUser = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!activityUser) {
    throw new CustomError(JSON.stringify({ message: `User with id: ${userId} not found. ` }), 400);
  }

  let whereClause: Prisma.CaseActivityLogWhereInput = {
    Case: {
      ...(query.caseId
        ? {
            id: query.caseId,
          }
        : {
            CaseTeamAssignments: {
              some: {
                CaseRole: CLIENT,
                UserId: userId,
              },
            },
          }),

      OR: [
        {
          Title: {
            contains: query.caseName || '',
            mode: 'insensitive',
          },
        },
        {
          CaseType: query.caseType
            ? query.caseType
            : {
                not: null,
              },
        },
      ],
    },

    OR: [
      !query.search? {
        FamilyMemberCaseActivityLogs: {
          none: {},
        },
      }: {},
      {
        FamilyMemberCaseActivityLogs: {
          some: {
            UserFamilyMember: {
              FirstName: {
                startsWith: query.search || '',
                mode: 'insensitive',
              },
              LastName: {
                startsWith: query.search || '',
                mode: 'insensitive',
              },
            },
          },
        },
      },
      {
        User: {
          StakeholderGroupRoles: {
            some: {
              StakeholderGroupRole: {
                Name: {
                  not: CLIENT,
                },
              },
            },
          },
          OR: [
            {
              FirstName: {
                startsWith: query.search || '',
                mode: 'insensitive',
              },
            },
            {
              LastName: {
                startsWith: query.search || '',
                mode: 'insensitive',
              },
            },
          ],
        },
      },
      !query.search? { ActivitiesCaseFiles: { none: {} } }:{},
      {
        ActivitiesCaseFiles: {
          some: {
            CaseFile: {
              GeneratedFile: {
                UserFamilyMember: {
                  OR: [
                    {
                      FirstName: {
                        startsWith: query.search || '',
                        mode: 'insensitive',
                      },
                    },
                    {
                      LastName: {
                        startsWith: query.search || '',
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    ],

    ActivityType: {
      in: activityTypeFilter?.length ? activityTypeFilter : CaseActivityLogTypes,
    },

    CreatedAt: {
      gte: query.from || activityUser.CreatedAt,
      lte: query.to || new Date(),
    },
  };

  console.log({ debugType: 'whereClause', value: whereClause });

  const data = await db.caseActivityLog.findMany({
    where: whereClause,
    orderBy: {
      CreatedAt: 'desc',
    },
    skip: query.skip,
    take: query.take,
    include: {
      User: true,
      ActivitiesCaseFiles: {
        include: {
          CaseFile: {
            include: {
              GeneratedFile: {
                include: {
                  UserFamilyMember: true,
                },
              },
            },
          },
        },
      },
      FamilyMemberCaseActivityLogs: {
        include: {
          UserFamilyMember: true,
        },
      },
    },
  });

  const count = await db.caseActivityLog.count({
    where: whereClause,
  });

  const retVal = {
    skip: query.skip,
    take: query.take,
    total: count,
    totalPages: Math.ceil(count / query.take),
    items: data,
  };
  return retVal;
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
