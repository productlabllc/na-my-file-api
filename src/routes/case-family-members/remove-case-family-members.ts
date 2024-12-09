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
import { CASE_OWNER } from '../../lib/constants';
import { DeleteCaseFamilyMembersRequest } from '../../lib/route-interfaces/case-applicant.schema';
import { logActivity } from '../../lib/sqs';

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

  const data = await db.caseApplicant.softDeleteMany({
    where: {
      AND: {
        CaseId: caseId,
        Case: {
          CaseTeamAssignments: {
            every: {
              UserId: userId,
              CaseRole: CASE_OWNER,
            },
          },
        },
        UserFamilyMemberId: {
          in: requestBody.map(ele => ele.UserFamilyMemberId),
        },
      },
    },
  });

  await logActivity({
    activityType: 'REMOVE_CASE_FAMILY_MEMBERS',
    activityValue: `User (${user.Email} - ${user.IdpId}) removed case family members (${requestBody.map(item => item.UserFamilyMemberId)}) for case ${caseId}`,
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE',
  });

  return data;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
