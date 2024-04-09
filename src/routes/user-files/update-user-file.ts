import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { UpdateUserFileRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { getDB } from '../../lib/db';

import {
  UpdateFamilyMemberRequestSchema,
  UpdateFamilyMemberResponseSchema,
} from '../../lib/route-schemas/family-member.schema';

export const routeSchema: RouteSchema = {
  requestBody: UpdateFamilyMemberRequestSchema,
  responseBody: UpdateFamilyMemberResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const body: UpdateUserFileRequest = input.body;

  try {
    const db = getDB();
    const jwt: NycIdJwtType = input.routeData.jwt;

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
      // create user file
      const file = await db.userFile.update({
        where: {
          id: body.id,
          AND: {
            OwnerUserId: userId,
          },
        },
        data: {
          ...(body.UserFamilyMemberId ? { UserFamilyMemberId: body.UserFamilyMemberId } : {}),
          ...(body.PageNumber ? { PageNumber: body.PageNumber } : {}),
          ...(body.Title ? { Title: body.Title } : {}),
          ...(body.Status ? { Status: body.Status } : {}),
          ...(body.ContentType ? { ContentType: body.ContentType } : {}),
          ...(body.OriginalFilename ? { OriginalFilename: body.OriginalFilename } : {}),
        },
        select: {
          id: true,
          User: true,
          UserFamilyMemberId: true,
          OriginalFilename: true,
          Title: true,
          PageNumber: true,
          Status: true,
          ContentType: true,
          ActiveVersionId: true,
          CreatedAt: true,
          LastModifiedAt: true,
        },
      });

      // update upload version
      const uploadVersion = await db.uploadedMediaAssetVersion.update({
        where: {
          id: file.ActiveVersionId!,
          AND: {
            UserFileId: file.id,
          },
        },
        data: {
          UserFileId: file.id,
          CreatedByUserId: userId,
          ...(body.ContentType ? { ContentType: body.ContentType } : {}),
          ...(body.OriginalFilename ? { OriginalFilename: body.OriginalFilename } : {}),
          ...(body.SizeInBytes ? { SizeInBytes: body.SizeInBytes } : {}),
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

      return {
        ...file,
        UploadedMediaAssetVersions: [uploadVersion],
      };
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
