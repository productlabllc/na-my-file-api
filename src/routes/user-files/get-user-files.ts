import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getDB } from '../../lib/db';
import { GetUserFilesResponseSchema } from '../../lib/route-schemas/user-file.schema';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { USER_FILE_STATUS } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  responseBody: GetUserFilesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const jwt: NycIdJwtType = input.routeData.jwt;

    const user = await getUserByIdpId(jwt?.GUID);

    const userId = user.id;

    const userFiles = await db.userFile.findMany({
      where: {
        OwnerUserId: userId,
        DeletedAt: null,
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

      select: {
        id: true,
        OriginalFilename: true,
        Title: true,
        ContentType: true,
        ActiveVersionId: true,
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
