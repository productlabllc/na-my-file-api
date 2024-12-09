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
import { DeleteCaseFamilyMembersRequestSchema } from '../../lib/route-schemas/case-applicant.schema';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CLIENT } from '../../lib/constants';
import { DeleteCaseFamilyMembersRequest } from '../../lib/route-interfaces/case-applicant.schema';
import { logActivity, triggerCaseCriterionCalculation } from '../../lib/sqs';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: DeleteCaseFamilyMembersRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const requestBody: DeleteCaseFamilyMembersRequest = input.body;

  const concernedUsers = await db.caseApplicant.findMany({
    where: {
      CaseId: caseId,
      UserFamilyMemberId: {
        in: requestBody.map(ele => ele.UserFamilyMemberId),
      },
    },
    include: {
      UserFamilyMember: true,
      Case: true,
    },
  });

  const data = await db.caseApplicant.softDeleteMany({
    where: {
      AND: {
        CaseId: caseId,
        Case: {
          CaseTeamAssignments: {
            every: {
              UserId: userId,
              CaseRole: CLIENT,
            },
          },
        },
        UserFamilyMemberId: {
          in: requestBody.map(ele => ele.UserFamilyMemberId),
        },
      },
    },
  });

  await triggerCaseCriterionCalculation({ caseId });

  const activityData: ActivityLogMessageType = {
    activityType: 'CLIENT_REMOVE_CASE_FAMILY_MEMBERS',
    activityValue: JSON.stringify({
      oldValue: concernedUsers.map(ele => ele.UserFamilyMember),
      case: concernedUsers[0].Case,
    }),
    userId: user.id,
    familyMemberIds: concernedUsers.map(ele => ele.UserFamilyMember?.id!),
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE_FAMILY_MEMBER',
  };

  await logActivity({ ...activityData, activityCategory: 'case' });

  return data;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
