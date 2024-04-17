import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import Joi = require('joi');
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { UpdateUserRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { UpdateUserRequestSchema, UpdateUserResponseSchema } from '../../lib/route-schemas/user.schema';
import tokenOwnsRequestedUser from '../../lib/middleware/token-owns-user.middleware';

const routeSchema: RouteSchema = {
  requestBody: UpdateUserRequestSchema,
  responseBody: UpdateUserResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: UpdateUserRequest = { ...input.body };

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  // get valid fields in request body
  const updateKeys = Object.keys(requestBody) as Array<keyof typeof requestBody>;
  const updateFields = updateKeys.reduce((acc, key) => {
    if (requestBody[key] == undefined && requestBody[key] == null) {
      delete acc[key];
    }
    return acc;
  }, requestBody);

  const updatedUser = await db.user.update({
    where: {
      id: user?.id,
    },
    data: {
      ...updateFields,
    },
    select: {
      id: true,
      FirstName: true,
      LastName: true,
      Email: true,
      DOB: true,
      LanguageIsoCode: true,
      TOSAcceptedAt: true,
      PPAcceptedAt: true,
      CreatedAt: true,
      LastModifiedAt: true,
    },
  });

  return updatedUser;
};

const routeModule: RouteModule = {
  routeChain: [
    jwtValidationMiddleware,
    schemaValidationMiddleware(routeSchema),
    handler,
  ],
  routeSchema,
};

export default routeModule;
