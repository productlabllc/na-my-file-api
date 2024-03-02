import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { UpdateUserRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { UpdateUserRequestSchema, UpdateUserResponseSchema } from '../../lib/route-schemas/user.schema';

export const routeSchema: RouteSchema = {
  requestBody: UpdateUserRequestSchema,
  responseBody: UpdateUserResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: UpdateUserRequest = { ...input.body };

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user.id;

  // get valid fields in request body
  const updateKeys = Object.keys(requestBody) as Array<keyof typeof requestBody>;
  const updateFields = updateKeys.reduce((acc, key) => {
    if (requestBody[key] == undefined && requestBody[key] == null) {
      delete acc[key];
    }
    return acc;
  }, requestBody);

  // make sure language exists
  if (updateFields.LanguageId) {
    const language = await db.language.findUnique({
      where: {
        id: updateFields.LanguageId,
      },
    });

    if (!language) {
      throw new CustomError(
        JSON.stringify({
          message: `Language ${updateFields.LanguageId} not found`,
        }),
        400,
      );
    }
  }

  const updatedUser = await db.user.update({
    where: {
      id: userId,
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
      LanguageId: true,
      TOSAcceptedAt: true,
      PPAcceptedAt: true,
      CreatedAt: true,
      LastModifiedAt: true,
    },
  });

  return updatedUser;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;