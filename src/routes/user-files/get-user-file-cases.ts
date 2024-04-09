import Joi = require('joi');

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
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';

const routeSchema: RouteSchema = {
  params: {
    fileId: Joi.string().uuid(),
    userId: Joi.string().uuid(),
  },
  responseBody: GetUserFileCasesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { fileId } = input.params as { fileId: string };
  const db = getDB();

  const overallCase = await db.caseFile.findMany({
    where: {
      UserFileId: fileId,
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
