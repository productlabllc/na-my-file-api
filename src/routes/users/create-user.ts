import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CreateUserRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { CreateUserRequestSchema, CreateUserResponseSchema } from '../../lib/route-schemas/user.schema';
import createUser from '../../lib/data/create-user-nyc';

const routeSchema: RouteSchema = {
  requestBody: CreateUserRequestSchema,
  responseBody: CreateUserResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: CreateUserRequest = input.body;

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  if (userId) {
    throw new CustomError(JSON.stringify({ message: 'User already exists' }), 409);
  }

  const newUser = await createUser({
    FirstName: requestBody.FirstName,
    LastName: requestBody.LastName,
    LanguageIsoCode: requestBody.LanguageIsoCode,
    GUID: jwt.sub,
    Email: requestBody.Email,
  });

  return newUser;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
