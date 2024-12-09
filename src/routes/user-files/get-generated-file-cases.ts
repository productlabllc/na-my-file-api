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
import { GetUserFileCasesResponseSchema } from '../../lib/route-schemas/case.schema';

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
      GeneratedFileId: fileId,
      DeletedAt: null,
    },
    include: {
      Case: {
        where: {
          DeletedAt: null,
        },
      },
    },
  });

  return overallCase.map(caseFile => caseFile.Case);
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
