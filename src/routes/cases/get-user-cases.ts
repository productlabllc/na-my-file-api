import {
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
import { CASE_STATUS, CLIENT } from '../../lib/constants';
import * as joi from 'joi';

const routeSchema: RouteSchema = {
  query: {
    status: joi
      .string()
      .valid(...Object.values(CASE_STATUS), '')
      .default(''),
  },
  responseBody: GetCasesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const { status } = input.query;

  const overallCase = await db.case.findMany({
    where: {
      CaseTeamAssignments: {
        /**
         * You can view the case iff you are in the case team or you are case owner.
         */
        some: {
          UserId: userId,
        },
      },
      DeletedAt: null,
      Status: status ? status : undefined,
    },
    include: {
      CaseApplicants: {
        where: {
          DeletedAt: null,
        },
      },
      CaseTeamAssignments: {
        where: {
          DeletedAt: null,
        },
        include: {
          User: true,
        },
      },
      CaseCriteria: {
        where: {
          DeletedAt: null,
        },
        include: {
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
                  WorkFlow: {
                    where: {
                      DeletedAt: null,
                    },
                  },
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
      },
    },
    orderBy: {
      CreatedAt: 'desc',
    },
  });

  await logActivity({
    activityType: 'AGENT_GET_ALL_USER_CASES',
    activityValue: JSON.stringify({ value: {}, case: overallCase[0] }),
    userId: user?.id!,
    activityRelatedEntity: 'USER_CASE',
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
  });

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
