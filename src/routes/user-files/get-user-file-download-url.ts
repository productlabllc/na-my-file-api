import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import * as joi from 'joi';
import { getDB } from '../../lib/db';
import { GetUserFileDownloadUrlResponseSchema } from '../../lib/route-schemas/user-file.schema';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { getPresignedDownloadUrl } from '../../lib/s3';
import { EnvironmentVariablesEnum } from '../../lib/environment';

export const routeSchema: RouteSchema = {
  query: {
    fileId: joi.string().required().uuid(),
    uploadVersionId: joi.string().required().uuid(),
  },
  responseBody: GetUserFileDownloadUrlResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const jwt: NycIdJwtType = input.routeData.jwt;

    const user = await getUserByIdpId(jwt?.GUID);

    const userId = user.id;

    const { fileId, uploadVersionId } = input.query as { fileId: string; uploadVersionId: string };

    const userFile = await db.userFile.findFirst({
      where: {
        id: fileId,
        OwnerUserId: userId,
        DeletedAt: null,
      },
    });

    if (!userFile) {
      throw new CustomError(`File ${fileId} not found`, 404);
    }

    const presignedUrl = await getPresignedDownloadUrl(
      EnvironmentVariablesEnum.CLIENT_FILE_BUCKET_NAME,
      `${userId}/${fileId}/${uploadVersionId}`,
    );

    return {
      downloadUrl: presignedUrl,
    };
  } catch (error: any) {
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
