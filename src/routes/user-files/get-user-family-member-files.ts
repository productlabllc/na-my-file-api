import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getDB } from '../../lib/db';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { GetUserFilesResponseSchema } from '../../lib/route-schemas/user-file.schema';
import Joi = require('joi');
import { USER_FILE_STATUS } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  params: {
    userId: Joi.string().uuid(),
  },
  query: {
    userFamilyMemberId: Joi.string().uuid().required(),
  },
  responseBody: GetUserFilesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const jwt: CognitoJwtType = input.routeData.jwt;

    const user = await getUserByEmail(jwt?.email);

    const userId = input.params.userId as string;

    const ownedByUser = userId === user.id;

    if (!ownedByUser) {
      throw new CustomError(JSON.stringify({ message: 'User does not have permission to download this file' }), 403);
    }

    const { userFamilyId } = input.query as { userFamilyId: string };
    const userFiles = await db.userFile.findMany({
      where: {
        OwnerUserId: userId,
        DeletedAt: null,
        Status: {
          not: USER_FILE_STATUS.DRAFT,
        },
        UserFamilyMemberId: userFamilyId,
      },

      select: {
        id: true,
        OriginalFilename: true,
        Title: true,
        ContentType: true,
        ActiveVersionId: true,
        CreatedAt: true,
        LastModifiedAt: true,
        UploadedMediaAssetVersions: true,
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
