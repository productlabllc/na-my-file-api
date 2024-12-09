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
import { getPresignedDownloadUrl } from '../../lib/s3';
import { EnvironmentVariablesEnum } from '../../lib/environment';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CAN_DOWNLOAD_USER_FILE } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  query: {
    generatedFileId: joi.string().required(),
    userId: joi.string().required(),
  },
  responseBody: GetUserFileDownloadUrlResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const user = await getUserByEmail(input.routeData.jwt?.email);

    const canDownload = await user.isUserInGroup(CAN_DOWNLOAD_USER_FILE);

    const { generatedFileId, userId } = input.query as { generatedFileId: string; userId: string };

    const userHasFile = userId === user.id;

    if (!canDownload && !userHasFile) {
      throw new CustomError('User does not have permission to download this file', 403);
    }

    const thisGeneratedFile = await db.generatedFile.findFirst({
      where: {
        id: generatedFileId,
      },
      select: {
        OriginalFilename: true,
      },
    });

    if (!thisGeneratedFile) {
      throw new CustomError('Generated file does not exist', 400);
    }

    const presignedUrl = await getPresignedDownloadUrl(
      EnvironmentVariablesEnum.CLIENT_FILE_BUCKET_NAME,
      `${userId}/${generatedFileId}.${thisGeneratedFile?.OriginalFilename?.split('.').pop() ?? 'pdf'}`,
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
