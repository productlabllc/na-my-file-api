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
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CAN_GET_CASE, CASE_OWNER } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  responseBody: GetCaseResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  // Constrain by user id is not needed in this case because a case might not just belong to a user.
  const user = await getUserByEmail(input.routeData.jwt?.email);

  const getCase = await user.isUserInGroup(CAN_GET_CASE);

  const overallCase = await db.case.findFirst({
    where: {
      id: caseId,
      DeletedAt: null,
    },
    include: {
      CaseApplicants: true,
      CaseTeamAssignments: true,
      CaseFiles: true,
      CaseCriteria: true,
      CaseNotes: true,
    },
  });

  const userHasFile = overallCase?.CaseTeamAssignments.find(user => user.CaseRole === CASE_OWNER)?.UserId === user.id;

  if (!getCase && !userHasFile) {
    throw new CustomError('User does not have permission to get this case', 403);
  }

  await logActivity({
    activityType: 'GET_CASE_BY_ID',
    activityValue: `User (${user.Email} - ${user.IdpId}) retrieved case details for case (${caseId}).`,
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE',
  });

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
