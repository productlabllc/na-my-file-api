import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { DeleteUserFileRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { getDB } from '../../lib/db';
import { DeleteUserFileRequestSchema } from '../../lib/route-schemas/user-file.schema';

export const routeSchema: RouteSchema = {
  requestBody: DeleteUserFileRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const body: DeleteUserFileRequest = input.body;

  try {
    const db = getDB();
    const jwt: NycIdJwtType = input.routeData.jwt;

    const user = await getUserByIdpId(jwt?.GUID);

    const userId = user.id;

    const userFile = await db.$transaction(async db => {
      // create user file
      await db.userFile.softDelete({
        where: {
          id: body.id,
          AND: {
            OwnerUserId: userId,
          },
        },
      });

      // delete upload version
      await db.uploadedMediaAssetVersion.softDeleteMany({
        where: {
          UserFileId: body.id,
        },
      });

      return {};
    });

    return userFile;
  } catch (error: any) {
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
