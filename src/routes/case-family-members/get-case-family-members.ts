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

  const data = await db.caseApplicant.findMany({
    where: {
      CaseId: caseId,
      DeletedAt: null,
    },
  });

  await logActivity({
    activityType: 'ADD_CASE_FAMILY_MEMBERS',
    activityValue: `User (${user.Email} - ${user.IdpId}) retrieved case family members (applicants) for case ${caseId}`,
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
