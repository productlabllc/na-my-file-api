import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import joi = require('joi');
import { getDB } from '../../lib/db';
import { GetUserFileDownloadUrlResponseSchema } from '../../lib/route-schemas/user-file.schema';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { getPresignedDownloadUrl } from '../../lib/s3';
import { EnvironmentVariablesEnum } from '../../lib/environment';
import { CAN_DOWNLOAD_USER_FILE } from '../../lib/constants';

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

    const jwt: CognitoJwtType = input.routeData.jwt;

    const user = await getUserByEmail(jwt?.email);

    const userId = user.id;

    const canDownloadFile = await user.isUserInGroup(CAN_DOWNLOAD_USER_FILE);

    const { fileId, uploadVersionId } = input.query as { fileId: string; uploadVersionId: string };

    const userFile = await db.userFile.findFirst({
      where: {
        id: fileId,
        DeletedAt: null,
      },
    });

    const userHasFile = userFile?.OwnerUserId === userId;

    if (!canDownloadFile && !userHasFile) {
      throw new CustomError('User does not have permission to download this file', 403);
    }

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
