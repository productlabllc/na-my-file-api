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
import { CaseApplicantSchema } from '../../lib/route-schemas/case-applicant.schema';
import { logActivity } from '../../lib/sqs';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';
import { CLIENT } from '../../lib/constants';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  responseBody: Joi.array().items(CaseApplicantSchema),
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();
  const jwt: CognitoJwtType = input.routeData.jwt;
  const user = await getUserByEmail(jwt?.email);

  const thisCase = await db.case.findFirstOrThrow({
    where: {
      id: caseId,
      DeletedAt: null,
    },
    include: {
      CaseTeamAssignments: {
        where: {
          CaseRole: CLIENT,
        },
        include: {
          User: true,
        },
      },
      CaseApplicants: {
        include: {
          UserFamilyMember: true,
        },
      },
    },
  });

  const activityData: ActivityLogMessageType = {
    activityType: 'CLIENT_GET_CASE_FAMILY_MEMBERS',
    activityValue: JSON.stringify({ value: thisCase.CaseApplicants, case: thisCase }),
    userId: user.id,
    timestamp: new Date(),
    familyMemberIds: thisCase.CaseApplicants.map(ca => ca.UserFamilyMemberId!).filter(ele => ele),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE_FAMILY_MEMBER',
  };

  await logActivity({ ...activityData, activityCategory: 'case' });

  return thisCase.CaseApplicants;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
