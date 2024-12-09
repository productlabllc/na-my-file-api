import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { CreateUserFileRequestSchema } from '../../lib/route-schemas/user-file.schema';
import { CreateUserFileRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { getDB } from '../../lib/db';
import { getPresignedUploadUrl } from '../../lib/s3';
import { EnvironmentVariablesEnum } from '../../lib/environment';
import { USER_FILE_STATUS } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  requestBody: CreateUserFileRequestSchema,
  responseBody: CreateUserFileRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const body: CreateUserFileRequest = input.body;

  try {
    const db = getDB();
    const jwt: CognitoJwtType = input.routeData.jwt;

    const user = await getUserByEmail(jwt?.email);

    const userId = user.id;

    const familyMemberId = body.UserFamilyMemberId;

    // check if family member exists
    if (familyMemberId) {
      const familyMember = await db.userFamilyMember.findFirst({
        where: {
          id: familyMemberId,
          UserId: userId,
          DeletedAt: null,
        },
      });

      if (!familyMember) {
        throw new CustomError(`Family member ${familyMemberId} not found`, 400);
      }
    }

    const userFile = await db.$transaction(async db => {
      // create generated file
      const generatedFile =
        body.Files.length > 1
          ? await db.generatedFile.create({
              data: {
                Title: body.Title,
                Status: USER_FILE_STATUS.DRAFT,
              },
              select: {
                id: true,
                Title: true,
                Status: true,
                CreatedAt: true,
                LastModifiedAt: true,
              },
            })
          : null;

      const userFiles = await Promise.all(
        body.Files.map(async (fileItem, index: number) => {
          // create user file
          const file = await db.userFile.create({
            data: {
              ...(body.UserFamilyMemberId ? { UserFamilyMemberId: body.UserFamilyMemberId } : {}),
              Title: `${body.Title} - page ${index + 1}`,
              OwnerUserId: userId,
              PageNumber: index + 1,
              Status: USER_FILE_STATUS.DRAFT,
              ContentType: fileItem.ContentType,
              ...(generatedFile?.id ? { GeneratedFileId: generatedFile.id } : {}),
              OriginalFilename: fileItem.OriginalFilename,
            },
            select: {
              id: true,
              User: true,
              UserFamilyMemberId: true,
              OriginalFilename: true,
              Title: true,
              ContentType: true,
              Status: true,
              GeneratedFile: true,
              CreatedAt: true,
              LastModifiedAt: true,
            },
          });

          // create upload version
          const uploadVersion = await db.uploadedMediaAssetVersion.create({
            data: {
              UserFileId: file.id,
              CreatedByUserId: userId,
              ContentType: fileItem.ContentType,
              SizeInBytes: fileItem.SizeInBytes,
              OriginalFilename: fileItem.OriginalFilename,
            },
            select: {
              id: true,
              UserFileId: true,
              ContentType: true,
              SizeInBytes: true,
              OriginalFilename: true,
              CreatedByUserId: true,
              CreatedAt: true,
              LastModifiedAt: true,
            },
          });

          // append upload version to user file

          await db.userFile.update({
            where: {
              id: file.id,
            },
            data: {
              ActiveVersionId: uploadVersion.id,
            },
          });
          const uploadUrl = await getPresignedUploadUrl(
            EnvironmentVariablesEnum.CLIENT_FILE_BUCKET_NAME,
            `${userId}/${file.id}/${uploadVersion.id}`,
          );

          return {
            ...file,
            UploadedMediaAssetVersions: [uploadVersion],
            UploadUrl: uploadUrl,
          };
        }),
      );

      return userFiles;
    });

    return userFile;
  } catch (error: any) {
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
