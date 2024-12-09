import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getDB } from '../../lib/db';
import joi = require('joi');
import { LanguageSchema } from '../../lib/route-schemas/language.schema';
import { ActivityLogTypesList } from '../../lib/types-and-interfaces';

export const routeSchema: RouteSchema = {
  responseBody: joi.array().items(joi.string()),
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => ActivityLogTypesList;

const routeModule = {
  routeChain: [handler],
  routeSchema,
};

export default routeModule;
