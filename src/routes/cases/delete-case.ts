import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getDB } from '../../lib/db';
import * as Joi from 'joi';

export const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

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
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
