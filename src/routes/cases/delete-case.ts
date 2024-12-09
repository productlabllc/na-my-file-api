import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getDB } from '../../lib/db';
import Joi = require('joi');
import { logActivity } from '../../lib/sqs';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();
  const jwt: CognitoJwtType = input.routeData.jwt;
  const user = await getUserByEmail(jwt?.email);

  const existingCase = await db.case.findFirst({ where: { id: caseId } });
  // delete core case
  await db.case.softDelete({
    where: {
      id: caseId,
    },
  });

  // delete all case notes
  await db.caseNote.softDeleteMany({ where: { CaseId: caseId } });

  // delete all case applicants
  await db.caseApplicant.softDeleteMany({ where: { CaseId: caseId } });

  // delete all case team assigment
  await db.caseTeamAssignment.softDeleteMany({ where: { CaseId: caseId } });

  // delete all case files
  await db.caseFile.softDeleteMany({ where: { CaseId: caseId } });

  // delete all case criterion
  await db.caseCriterion.softDeleteMany({ where: { CaseId: caseId } });

  const activityType: ActivityLogMessageType = {
    activityType: 'CLIENT_DELETE_CASE',
    activityValue: JSON.stringify({ case: existingCase, oldValue: existingCase }),
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE',
  };

  await logActivity({ ...activityType, activityCategory: 'case' });
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
