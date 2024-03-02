import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import * as joi from 'joi';
import { getDB } from '../../lib/db';
import { GetUserFileDownloadUrlResponseSchema } from '../../lib/route-schemas/user-file.schema';
import { getPresignedDownloadUrl } from '../../lib/s3';
import { EnvironmentVariablesEnum } from '../../lib/environment';

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

    const { generatedFileId, userId } = input.query as { generatedFileId: string; userId: string };

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
  routeChain: [schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
