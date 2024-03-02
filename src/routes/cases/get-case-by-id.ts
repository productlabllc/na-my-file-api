import * as Joi from 'joi';

import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';

import { getDB } from '../../lib/db';
import { GetCaseResponseSchema } from '../../lib/route-schemas/case.schema';

export const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  responseBody: GetCaseResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  // Constrain by user id is not needed in this case because a case might not just belong to a user.

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

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
