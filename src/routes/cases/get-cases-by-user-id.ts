const Joi = require('joi');
import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { GetCasesResponseSchema } from '../../lib/route-schemas/case.schema';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { logActivity } from '../../lib/sqs';
import { CAN_ADD_CASE_FILE_WORKFLOW_ROLES, CLIENT } from '../../lib/constants';

const routeSchema: RouteSchema = {
  responseBody: GetCasesResponseSchema,
  params: {
    userId: Joi.string().required(),
  },
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;
  const { userId } = input.params as { userId: string };

  const user = await getUserByEmail(jwt?.email);

  const userRoles = user.StakeholderGroupRoles.map(role => role.StakeholderGroupRole?.Name);

  const allRoles = CAN_ADD_CASE_FILE_WORKFLOW_ROLES;

  const canUserViewCases = userRoles.some(role => allRoles.includes(role as any));

  if (!canUserViewCases) {
    throw new CustomError(
      JSON.stringify({ message: 'User does not have permission to view cases', statusCode: 403 }),
      403,
    );
  }

  const overallCase = await db.case.findMany({
    where: {
      AND: [
        {
          CaseTeamAssignments: {
            some: {
              UserId: userId,
              CaseRole: CLIENT,
              DeletedAt: null,
            },
          },
        },
        {
          CaseTeamAssignments: {
            some: {
              UserId: user.id,
              DeletedAt: null,
            },
          },
        },
      ],
    },
    include: {
      CaseApplicants: {
        where: {
          DeletedAt: null,
        },
      },
      CaseTeamAssignments: {
        where: {
          CaseRole: CLIENT,
          DeletedAt: null,
        },
        include: {
          User: {
            where: {
              DeletedAt: null,
            },
          },
        },
      },
      CaseCriteria: {
        where: {
          DeletedAt: null,
        },
        include: {
          CaseFiles: {
            where: {
              DeletedAt: null,
            },
            include: {
              GeneratedFile: {
                where: {
                  DeletedAt: null,
                },
                include: {
                  UserFamilyMember: true,
                },
              },
            },
          },
          WorkflowStageCriterion: {
            where: {
              DeletedAt: null,
            },
            include: {
              WorkflowStage: {
                where: {
                  DeletedAt: null,
                },
                include: {
                  WorkFlow: true,
                },
              },
            },
          },
        },
      },
      CaseFiles: {
        where: {
          DeletedAt: null,
        },
        include: {
          GeneratedFile: {
            where: {
              DeletedAt: null,
            },
            include: {
              FromUserFiles: {
                where: {
                  DeletedAt: null,
                },
              },
              UserFamilyMember: {
                where: {
                  DeletedAt: null,
                },
              },
            },
          },
        },
      },
      CaseNotes: {
        where: {
          DeletedAt: null,
        },
        include: {
          AuthorUser: true,
        },
      },
    },
  });

  await logActivity({
    activityType: 'AGENT_GET_USER_CASES',
    activityValue: JSON.stringify({ value: {} }),
    userId: user?.id!,
    timestamp: new Date(),
    activityRelatedEntity: 'USER_CASE',
    metadataJson: JSON.stringify({ request: input }),
  });

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
