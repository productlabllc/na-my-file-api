const Joi = require('joi');
import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { CLIENT } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';
import { GetUsersCasesSchema } from '../../lib/route-schemas/user.schema';

const routeSchema: RouteSchema = {
  query: {
    search: Joi.string().required().allow(''),
    skip: Joi.number(),
    take: Joi.number(),
  },
  responseBody: GetUsersCasesSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const ipt = input.query as { search?: string; skip?: number; take?: number };

  const query = { search: ipt.search ?? '', skip: ipt.skip ?? 0, take: ipt.take ?? 20 };

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userRoles = (
    await db.stakeholderGroupRole.findMany({
      where: {
        DeletedAt: null,
        User_StakeholderGroupRole: {
          some: {
            UserId: user.id,
          },
        },
      },
    })
  ).map(ele => ele.Name ?? '');

  const users = await db.user.findMany({
    skip: query.skip,
    take: query.take,
    where: {
      DeletedAt: null,
      CaseTeamAssignments: {
        some: {
          CaseRole: CLIENT,
          DeletedAt: null,
          Case: {
            CaseTeamAssignments: {
              some: {
                DeletedAt: null,
                UserId: user.id,
                CaseRole: {
                  in: userRoles,
                },
              },
            },
            DeletedAt: null,
          },
        },
      },

      ...(query.search
        ? {
          OR: [
            {
              FirstName: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
            {
              LastName: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
            {
              Email: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
            {
              CaseTeamAssignments: {
                some: {
                  Case: {
                    OR: [
                      {
                        AgencyCaseIdentifier: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },

                      /* Search JSONB Field */
                      {
                        CaseAttributes: {
                          array_contains: [{
                            key: 'value',
                            value: query.search,
                            mode: 'insensitive',
                          }],
                        },
                      },

                      {
                        SSN: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },
                    ]
                  }
                }
              }
            }
            ],
        }
        : {}),
    },
    include: {
      CaseTeamAssignments: {
        include: {
          Case: true,
        },
      },
    },
  });

  const userIds = users.map(user => user.id);
  const latestActivityByUserUpload = await db.generatedFile.groupBy({
    by: ['CreatedByUserId'],
    _max: {
      LastModifiedAt: true,
    },
    where: {
      CreatedByUserId: {
        in: userIds,
      },
    },
    orderBy: {
      _max: {
        LastModifiedAt: 'desc',
      }
    },
  });

  console.log({
    dataLabel: 'latestActivityByUserUpload',
    data: latestActivityByUserUpload,
  });

  console.log({
    dataLabel: 'users',
    data: users,
  });

  const orderedUsersByLatestActivity: Array<any> = [];
  latestActivityByUserUpload.forEach(ele => {
    orderedUsersByLatestActivity.push(...users.filter(user => user.id === ele.CreatedByUserId));
  });
  orderedUsersByLatestActivity.push(...users.filter(user => !orderedUsersByLatestActivity.map(u => u.id).includes(user.id)));

  await logActivity({
    activityType: 'GET_CASES_ADMIN',
    activityValue: JSON.stringify({ value: {} }),
    userId: user?.id!,
    activityRelatedEntity: 'CASE',
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
  });

  return orderedUsersByLatestActivity;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
