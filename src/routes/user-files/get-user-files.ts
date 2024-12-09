import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getDB } from '../../lib/db';
import { GetUserFilesResponseSchema } from '../../lib/route-schemas/user-file.schema';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { USER_FILE_STATUS } from '../../lib/constants';
import Joi = require('joi');

export const routeSchema: RouteSchema = {
  params: {
    userId: Joi.string().uuid(),
  },
  responseBody: GetUserFilesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const jwt: CognitoJwtType = input.routeData.jwt;

    const user = await getUserByEmail(jwt?.email);

    const { userId } = input.params as { userId: string };

    const userOwnsTheFiles = userId === user.id;

    if (!userOwnsTheFiles) {
      throw new CustomError(JSON.stringify({ message: 'User does not have permission to download this file' }), 403);
    }

    const userFiles = await db.userFile.findMany({
      where: {
        DeletedAt: null,
        OwnerUserId: userId,
        UploadedMediaAssetVersions: {
          some: {
            DeletedAt: null,
          },
        },
        GeneratedFile: {
          DeletedAt: null,
        },
        Status: {
          not: USER_FILE_STATUS.DRAFT,
        },
      },
      include: {
        User: {
          where: {
            DeletedAt: null,
          },
        },
        UploadedMediaAssetVersions: {
          where: {
            DeletedAt: null,
          },
        },
        UserFamilyMember: {
          where: {
            DeletedAt: null,
          },
        },
        GeneratedFile: {
          where: {
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
                UserFamilyMember: {
                  where: {
                    DeletedAt: null,
                  },
                },
                User: {
                  where: {
                    DeletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        CreatedAt: {
          sort: 'desc',
        },
      },
    });

    return userFiles;
  } catch (error: any) {
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
