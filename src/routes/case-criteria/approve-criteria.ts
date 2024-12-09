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

import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { STAKEHOLDER_GROUP_ROLES as stgr, CASE_FILE_STATUS, CLIENT } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';
import { CaseCriteriaSchema } from '../../lib/route-schemas/case.schema';
import { Prisma } from '@prisma/client';

const routeSchema: RouteSchema = {
  params: {
    workflowStageId: Joi.string().uuid(),
    caseId: Joi.string().uuid(),
  },
  responseBody: CaseCriteriaSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { workflowStageId, caseId } = input.params as { workflowStageId: string; caseId: string };
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const allowedRoles = [stgr.SPONSOR, stgr.HPD_AGENT, stgr.HPD_ADMIN];

  const canApproveChecklist = user.StakeholderGroupRoles.find(ele =>
    allowedRoles.includes(ele?.StakeholderGroupRole?.Name as any),
  );

  if (!canApproveChecklist) {
    throw new CustomError(JSON.stringify({ message: 'User does not have permission to approve checklist' }), 400);
  }

  const workflowStage = await db.workflowStage.findFirst({
    where: {
      id: workflowStageId,
    },
    include: {
      WorkFlow: true,
    },
  });

  if (workflowStage && workflowStage.StagePosition! > 0) {
    const previousWorkflowStage = await db.workflowStage.findFirst({
      where: {
        WorkflowId: workflowStage!.WorkflowId,
        StagePosition: workflowStage!.StagePosition! - 1,
      },
      // attach the associated case criteria
      include: {
        WorkflowStageCriteria: {
          include: {
            CaseCriteria: {
              where: {
                CaseId: caseId,
              },
            },
          },
        },
      },
    });

    if (previousWorkflowStage) {
      const hasAllPreviousCriterionApproved = previousWorkflowStage.WorkflowStageCriteria.every(stCriterion =>
        stCriterion.CaseCriteria.every(criterion => criterion.CriterionFulfillmentStatus === 'DONE'),
      );

      if (!hasAllPreviousCriterionApproved) {
        throw new CustomError(
          JSON.stringify({
            message: 'Not all criteria from the previous stage have been approved',
            previousWorkflowStage,
          }),
          409,
        );
      }
    }
  }

  const criterion = await db.caseCriterion.findFirst({
    where: {
      CaseId: caseId,
      WorkflowStageCriterion: {
        WorkflowStage: {
          id: workflowStageId,
        },
      },
    },
    include: {
      Case: {
        include: {
          CaseTeamAssignments: {
            where: {
              CaseRole: CLIENT,
            },
          },
        },
      },
      WorkflowStageCriterion: {
        include: {
          WorkflowStage: true,
        },
      },
    },
  });

  const newCriterion = await db.caseCriterion.updateMany({
    where: {
      CaseId: caseId,
      WorkflowStageCriterion: {
        WorkflowStage: {
          id: workflowStageId,
        },
      },
      Case: {
        id: caseId,
        CaseTeamAssignments: {
          some: {
            UserId: user.id,
            CaseRole: {
              in: allowedRoles,
            },
          },
        },
      },
    },
    data: {
      CriterionFulfillmentStatus: 'DONE',
    },
  });

  // Also approve all documents in the checklist

  const filterQuery: Prisma.CaseFileWhereInput = {
    DeletedAt: null,
    CaseCriterion: {
      WorkflowStageCriterion: {
        WorkflowStage: {
          id: workflowStageId,
        },
      },
    },
  };

// Ticket S654 - Disabling set document status to accepted on approve checklist action. 
// Commenting out for now, remove in the future when bussiness logic have more solid confirmation.

//   await db.caseFile.updateMany({
//     where: filterQuery,
//     data: {
//       Status: CASE_FILE_STATUS.ACCEPTED,
//     },
//   });

  const caseFiles = await db.caseFile.findMany({
    where: filterQuery,
  });

  const activityType = 'AGENT_APPROVE_DOCUMENT_CHECKLIST';

  await logActivity({
    activityType,
    activityCategory: 'case',
    activityValue: JSON.stringify({
      newValue: newCriterion,
      oldValue: criterion,
      case: criterion?.Case,
    }),
    caseFilIds: caseFiles.map(cf => cf.id),
    userId: userId!,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: workflowStageId,
    activityRelatedEntity: 'WORKFLOW_STAGE',
  });

  return newCriterion;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
