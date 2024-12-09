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
import { S3Prefix } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  query: {
    fileId: joi.string().required().uuid(),
    disposition: joi.string().valid('attachment', 'inline'),
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

    const {
      fileId,
      uploadVersionId,
      disposition = 'inline',
    } = input.query as { fileId: string; uploadVersionId: string; disposition: 'attachment' | 'inline' };

    const userFile = await db.userFile.findFirst({
      where: {
        id: fileId,
        DeletedAt: null,
      },
    });

    const userHasFile = userFile?.OwnerUserId === userId;

    if (!userHasFile) {
      throw new CustomError(JSON.stringify({ message: 'User does not have permission to download this file' }), 403);
    }

    if (!userFile) {
      throw new CustomError(JSON.stringify({ message: `File ${fileId} not found` }), 404);
    }

    const fileVersion = await db.uploadedMediaAssetVersion.findFirst({
      where: {
        id: uploadVersionId,
        DeletedAt: null,
      },
    });

    if (!fileVersion) {
      throw new CustomError(
        JSON.stringify({ message: `File ${fileId} with version id ${uploadVersionId} not found` }),
        404,
      );
    }

    const presignedUrl = await getPresignedDownloadUrl(
      process.env[EnvironmentVariablesEnum.CLIENT_FILE_BUCKET_NAME]!,
      `${S3Prefix.USER_FILES}${userId}/${fileId}/${uploadVersionId}/${fileVersion.OriginalFilename}`,
      fileVersion.OriginalFilename!,
      disposition,
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
