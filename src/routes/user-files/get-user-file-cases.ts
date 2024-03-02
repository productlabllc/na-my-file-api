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
import { GetUserFileCasesResponseSchema } from '../../lib/route-schemas/case.schema';

export const routeSchema: RouteSchema = {
  params: {
    fileId: Joi.string().uuid(),
  },
  responseBody: GetUserFileCasesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const overallCase = await db.caseFile.findMany({
    where: {
      CaseId: caseId,
      DeletedAt: null,
    },
    include: {
      Case: true,
    },
  });

  return overallCase.map(caseFile => caseFile.Case);
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
