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
import { S3Prefix } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  query: {
    generatedFileId: joi.string().required(),
    isPreview: joi.boolean().default(false),
    disposition: joi.string().valid('attachment', 'inline'),
    userId: joi.string(),
  },
  responseBody: GetUserFileDownloadUrlResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const user = await getUserByEmail(input.routeData.jwt?.email);

    const {
      generatedFileId,
      userId,
      isPreview,
      disposition = 'inline',
    } = input.query as {
      generatedFileId: string;
      userId: string;
      disposition: 'attachment' | 'inline';
      isPreview: boolean;
    };

    const canDownload = await user.canViewGeneratedFile(generatedFileId);

    const thisGeneratedFile = await db.generatedFile.findFirst({
      where: {
        id: generatedFileId,
        DeletedAt: null,
      },
      include: {
        FromUserFiles: true,
      },
    });

    const userFileUserId = thisGeneratedFile?.FromUserFiles[0]?.OwnerUserId;

    const userHasThisFile = user.id === userFileUserId;

    if (!canDownload && !userHasThisFile) {
      throw new CustomError(
        JSON.stringify({
          message: 'User does not have permission to download this file',
          userId: user.id,
          userFileUserId,
        }),
        403,
      );
    }

    if (!thisGeneratedFile) {
      throw new CustomError(JSON.stringify({ message: 'Generated file does not exist' }), 400);
    }

    const presignedUrl = await getPresignedDownloadUrl(
      process.env[EnvironmentVariablesEnum.CLIENT_FILE_BUCKET_NAME]!,
      `${S3Prefix.GENERATED_FILES}${userId ?? user.id}/${generatedFileId}${isPreview ? '/preview' : ''}.png`,
      thisGeneratedFile.OriginalFilename!,
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
