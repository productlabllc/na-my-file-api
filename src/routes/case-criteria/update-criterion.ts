import Joi = require('joi');

import {
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
import { CAN_ADD_CASE_FILE_WORKFLOW_ROLES, CASE_FILE_STATUS, CLIENT } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';
import { CaseCriterionSchema, UpdateCaseCriterionSchema } from '../../lib/route-schemas/case.schema';
import { UpdateCaseCriterion } from '../../lib/route-interfaces';
import { ActivityLogMessageType, ActivityLogType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  params: {
    caseCriterionId: Joi.string().uuid(),
  },
  requestBody: UpdateCaseCriterionSchema,
  responseBody: CaseCriterionSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseCriterionId } = input.params as { caseCriterionId: string };
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const requestBody = input.body as UpdateCaseCriterion;

  const criterion = await db.caseCriterion.findFirst({
    where: {
      id: caseCriterionId,
    },
    include: {
      Case: {
        include: {
          CaseTeamAssignments: {
            where: {
              CaseRole: CLIENT,
            },
            include: {
              User: true,
            },
          },
        },
      },
    },
  });

  const newCriterion = await db.caseCriterion.update({
    where: {
      id: caseCriterionId,
      Case: {
        CaseTeamAssignments: {
          some: {
            UserId: user.id,
            CaseRole: {
              in: CAN_ADD_CASE_FILE_WORKFLOW_ROLES,
            },
          },
        },
      },
    },
    data: {
      CriterionFulfillmentStatus: requestBody.CriterionFulfillmentStatus,
      ...(requestBody.Name ? { Name: requestBody.Name } : {}),
      ...(requestBody.CriterionSubGroupName ? { CriterionSubGroupName: requestBody.CriterionSubGroupName } : {}),
      ...(requestBody.CriterionGroupName ? { CriterionGroupName: requestBody.CriterionGroupName } : {}),
      ...(requestBody.CriterionFulfillmentStatus
        ? {
            CaseFiles: {
              updateMany: {
                where: {},
                data: {
                  Status:
                    requestBody.CriterionFulfillmentStatus === 'DONE'
                      ? CASE_FILE_STATUS.ACCEPTED
                      : CASE_FILE_STATUS.PENDING,
                },
              },
            },
          }
        : {}),
    },
    include: {
      CaseFiles: {
        include: {
          CaseCriterion: true,
          GeneratedFile: {
            include: {
              UserFamilyMember: true,
            },
          },
        },
      },
    },
  });

  if (requestBody.CriterionFulfillmentStatus) {
    const cfWithFamilyMembers = newCriterion.CaseFiles.filter(cf => cf.GeneratedFile?.FamilyMemberId);
    const cfWithoutFamilyMember = newCriterion.CaseFiles.filter(cf => !cf.GeneratedFile?.FamilyMemberId);

    if (cfWithFamilyMembers.length) {
      const familyMembers = cfWithFamilyMembers.map(cf => cf.GeneratedFile?.UserFamilyMember!);

      const activityType: ActivityLogType =
        requestBody.CriterionFulfillmentStatus === 'DONE'
          ? 'AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER'
          : 'AGENT_REJECT_CASE_FILE_FAMILY_MEMBER';

      const activityData: ActivityLogMessageType = {
        activityType,
        activityValue: JSON.stringify({
          newValue: cfWithFamilyMembers,
          familyMember: familyMembers,
          case: criterion?.Case,
        }),
        userId: userId!,
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: caseCriterionId,
        activityRelatedEntity: 'CASE_CRITERION',
      };

      await logActivity({
        ...activityData,
        activityCategory: 'case',
        caseFilIds: cfWithFamilyMembers.map(cf => cf.id),
      });
    }

    if (cfWithoutFamilyMember.length) {
      const activityType: ActivityLogType =
        requestBody.CriterionFulfillmentStatus === 'DONE'
          ? 'AGENT_APPROVE_CASE_FILE_CLIENT'
          : 'AGENT_REJECT_CASE_FILE_CLIENT';

      const activityData: ActivityLogMessageType = {
        activityType,
        caseFilIds: cfWithoutFamilyMember.map(cf => cf.id),
        activityValue: JSON.stringify({
          newValue: cfWithFamilyMembers,
          case: criterion?.Case,
        }),
        userId: userId!,
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: caseCriterionId,
        activityRelatedEntity: 'CASE_CRITERION',
      };

      await logActivity({ ...activityData, activityCategory: 'case' });
    }
  } else {
    const activityType = 'AGENT_UPDATE_CASE_CRITERION';

    const activityData: ActivityLogMessageType = {
      activityType,
      activityValue: JSON.stringify({
        newValue: newCriterion,
        oldValue: criterion,
        case: criterion?.Case,
      }),
      userId: userId!,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: caseCriterionId,
      activityRelatedEntity: 'CASE_CRITERION',
    };

    await logActivity({ ...activityData, activityCategory: 'case' });
  }

  return newCriterion;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
