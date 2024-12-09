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

export const routeSchema: RouteSchema = {
  responseBody: GetUserFilesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const jwt: CognitoJwtType = input.routeData.jwt;

    const user = await getUserByEmail(jwt?.email);

    const userFiles = await db.userFile.findMany({
      where: {
        DeletedAt: null,
        OwnerUserId: user.id,
        UploadedMediaAssetVersions: {
          some: {
            DeletedAt: null,
          },
        },
        GeneratedFile: {
          DeletedAt: null,
        },
        Status: {
          // disabled for testing
          // not: USER_FILE_STATUS.DRAFT,
        },
      },

      select: {
        id: true,
        OwnerUserId: true,
        OriginalFilename: true,
        Title: true,
        FilePath: true,
        FileUploadedAt: true,
        FileType: true,
        ContentType: true,
        ActiveVersionId: true,
        GeneratedFile: true,
        GeneratedFileId: true,
        Status: true,
        CreatedAt: true,
        LastModifiedAt: true,
        UploadedMediaAssetVersions: true,
        UserFamilyMember: true,
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
