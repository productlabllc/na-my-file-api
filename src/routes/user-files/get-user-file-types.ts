import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { GetUserFileTypeResponseSchema } from '../../lib/route-schemas/user-file.schema';

import { DOCUMENT_TYPE } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  responseBody: GetUserFileTypeResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  return Object.values(DOCUMENT_TYPE).map(ele => ({ documentGroup: ele.category, documentName: ele.name }));
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
