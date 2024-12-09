import Joi = require('joi');

import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';

import { getDB } from '../../lib/db';
import { GetCaseResponseSchema } from '../../lib/route-schemas/case.schema';
import { CLIENT, USER_FILE_STATUS, WORKFLOW_USER_ROLES } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
    workflowType: Joi.string().uuid(),
  },
  responseBody: GetCaseResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId, workflowType } = input.params as { caseId: string; workflowType: keyof typeof WORKFLOW_USER_ROLES };
  const db = getDB();

  // Constrain by user id is not needed in this case because a case might not just belong to a user.

  const userEmail = input.routeData.jwt?.email;
  const user = await db.user.findFirst({ where: { Email: userEmail } });

  if (!user) {
    throw new CustomError(JSON.stringify({ message: `User Does Exists with email ${userEmail}` }), 400);
  }

  const overallCase = await db.case.findFirst({
    where: {
      id: caseId,
      DeletedAt: null,
      CaseTeamAssignments: {
        some: {
          UserId: user.id,
        },
      },
    },
    include: {
      CaseApplicants: true,
      CaseTeamAssignments: {
        where: {
          DeletedAt: null,
          CaseRole: CLIENT,
        },
        include: {
          User: true,
        },
      },
      CaseFiles: {
        where: {
          DeletedAt: null,
        },
        include: {
          GeneratedFile: {
            include: {
              FromUserFiles: true,
              UserFamilyMember: true,
            },
          },
        },
      },
      CaseCriteria: {
        where: {
          DeletedAt: null,
        },
        orderBy: {
          Index: 'desc',
        },
        include: {
          CaseFiles: {
            where: {
              DeletedAt: null,
            },
            include: {
              GeneratedFile: {
                include: {
                  UserFamilyMember: true,
                },
              },
              CaseCriterion: true,
            },
          },
          WorkflowStageCriterion: {
            where: {
              DeletedAt: null,
            },
            include: {
              WorkflowStage: {
                include: {
                  WorkFlow: true,
                },
              },
            },
          },
        },
      },
      CaseNotes: true,
    },
  });

  const logData: ActivityLogMessageType = {
    activityType: 'CLIENT_GET_CASE_BY_ID',
    activityValue: JSON.stringify({ value: overallCase }),
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE',
  };

  await logActivity({ ...logData, activityCategory: 'case' });

  const { CaseCriteria, ...caseProps } = overallCase!;
  // map for case to add image availability
  return {
    ...caseProps,
    CaseCriteria: CaseCriteria.map(cc => {
      const { CaseFiles, ...criteriaProps } = cc;
      return {
        ...criteriaProps,
        CaseFiles: CaseFiles.map(cf => {
          return {
            ...cf,
            imagesAvailable: cf.GeneratedFile?.Status === USER_FILE_STATUS.UPLOADED,
          };
        }),
      };
    }),
  };
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
