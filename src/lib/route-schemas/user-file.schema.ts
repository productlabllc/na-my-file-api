import joi = require('joi');

export const GeneratedUserFileSchema = joi
  .object({
    id: joi.string().uuid().required(),
    ContentType: joi.string(),
    OriginalFilename: joi.string(),
    Status: joi.string(),
    SizeInBytes: joi.number(),
    CreatedAt: joi.date(),
    LastModifiedAt: joi.date(),
    Title: joi.string(),
  })
  .meta({ className: 'GeneratedUserFile' });

const UserFileSchema = joi
  .object({
    id: joi.string().uuid(),
    LegacyId: joi.string(),
    ContentType: joi.string().required(),
    ActiveVersionId: joi.string().uuid(),
    OriginalFilename: joi.string().required(),
    Title: joi.string().required(),
    CreatedAt: joi.date(),
    LastModifiedAt: joi.date(),
    OwnerUserId: joi.string(),
    UploadedMediaAssetVersions: joi.array().items(joi.object()),
    UploadUrls: joi.array().items(joi.string()),
    CreatedByUserId: joi.string(),
    LastModifiedByUserId: joi.string().email(),
    UploadUrl: joi.string(),
  })
  .meta({ className: 'UserFile' });

export default UserFileSchema;

export const CreateUserFileRequestSchema = joi
  .object({
    UserFamilyMemberId: joi.string().uuid(),
    Title: joi.string().required(),
    Files: joi
      .array()
      .items(
        joi.object({
          ContentType: joi.string().required(),
          OriginalFilename: joi.string().required(),
          SizeInBytes: joi.number().required(),
          PageNumber: joi.number().required(),
        }),
      )
      .required(),
  })
  .meta({ className: 'CreateUserFileRequest' });

export const CreateUserFileResponseSchema = joi
  .object({
    UserFiles: joi.array().items(UserFileSchema),
  })
  .meta({ className: 'CreateUserFileResponse' });

export const UpdateUserFileRequestSchema = joi
  .object({
    id: joi.string().uuid().required(),
    ContentType: joi.string(),
    OriginalFilename: joi.string(),
    Status: joi.string(),
    SizeInBytes: joi.number(),
    PageNumber: joi.number(),
    UserFamilyMemberId: joi.string().uuid(),
    Title: joi.string(),
  })
  .meta({ className: 'UpdateUserFileRequest' });

export const UpdateFileResponseSchema = UserFileSchema.meta({ className: 'UpdateUserFileResponse' });

export const GetUserFilesResponseSchema = joi.array().items(UserFileSchema).meta({ className: 'GetUserFilesResponse' });

export const DeleteUserFileRequestSchema = joi
  .object({
    id: joi.string().uuid().required(),
  })
  .meta({ className: 'DeleteUserFileRequest' });

export const GetUserFileDownloadUrlResponseSchema = joi
  .object({
    downloadUrl: joi.string(),
  })
  .meta({ className: 'UserFileDownloadResponse' });

export const UpdateGeneratedFileRequestSchema = joi
  .object({
    id: joi.string().uuid().required(),
    ContentType: joi.string(),
    OriginalFilename: joi.string(),
    Status: joi.string(),
    SizeInBytes: joi.number(),
    Title: joi.string(),
  })
  .meta({ className: 'UpdateGeneratedFileRequest' });

export const UpdateGeneratedFileResponseSchema = GeneratedUserFileSchema.meta({
  className: 'UpdateGeneratedFileResponse',
});
