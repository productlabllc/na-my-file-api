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
import { GetGeneratedFileByIdResponse } from '../../lib/route-schemas/user-file.schema';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';

export const routeSchema: RouteSchema = {
  query: {
    id: joi.string().required(),
    userId: joi.string(),
  },
  responseBody: GetGeneratedFileByIdResponse,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const user = await getUserByEmail(input.routeData.jwt?.email);

    const { id } = input.query as { id: string; userId: string };

    const canDownload = await user.canViewGeneratedFile(id);

    const thisGeneratedFile = await db.generatedFile.findFirst({
      where: {
        id: id,
        DeletedAt: null,
      },
      include: {
        UserFamilyMember: {
          where: {
            DeletedAt: null,
          },
        },
        FromUserFiles: {
          where: {
            DeletedAt: null,
          },
          include: {
            UploadedMediaAssetVersions: {
              where: {
                DeletedAt: null,
              },
            },
            User: {
              where: {
                DeletedAt: null,
              },
            },
            UserFamilyMember: {
              where: {
                DeletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!thisGeneratedFile) {
      throw new CustomError(JSON.stringify({ message: 'Generated file does not exist' }), 400);
    }

    const userHasFile = thisGeneratedFile.FromUserFiles[0]?.OwnerUserId === user.id;

    if (!canDownload && !userHasFile) {
      throw new CustomError(JSON.stringify({ message: 'User does not have permission to view this file' }), 403);
    }

    return thisGeneratedFile;
  } catch (error: any) {
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
