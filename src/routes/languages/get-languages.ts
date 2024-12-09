import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getDB } from '../../lib/db';
import Joi = require('joi');
import { LanguageSchema } from '../../lib/route-schemas/language.schema';

export const routeSchema: RouteSchema = {
  responseBody: Joi.array().items(LanguageSchema),
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();
    return await db.language.findMany({
      where: {
        DeletedAt: null,
      },
      select: {
        id: true,
        Name: true,
        Code: true,
        CreatedAt: true,
      },
    });
  } catch (error: any) {
    console.log(error);
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
