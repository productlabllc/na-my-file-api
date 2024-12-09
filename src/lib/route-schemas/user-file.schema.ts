import joi = require('joi');
import uploadedMediaAssetSchema from './uploaded-media-asset.schema';
import { BaseCaseFileSchema, BaseFamilyMemberSchema, BaseUserFileSchema, BaseUserSchema } from './base-models.schema';

export const GeneratedUserFileSchema = joi
  .object({
    id: joi.string().uuid().required(),
    ContentType: joi.string(),
    OriginalFilename: joi.string(),
    Status: joi.string(),
    Description: joi.string().allow(''),
    FamilyMemberId: joi.string(),
    CreatedByUserId: joi.string(),
    CreatedByAgentUserId: joi.string(),
    CreatedByUser: BaseUserSchema,
    CreatedByAgentUser: BaseUserSchema,
    FileType: joi.string(),
    CaseFiles: joi.array().items(BaseCaseFileSchema),
    SizeInBytes: joi.number(),
    CreatedAt: joi.date(),
    LastModifiedAt: joi.date(),
    UserFamilyMember: BaseFamilyMemberSchema,
    FromUserFiles: joi.array().items(BaseUserFileSchema),
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
    FilePath: joi.string(),
    FileUploadedAt: joi.date(),
    UserFamilyMember: BaseFamilyMemberSchema,
    Title: joi.string().required(),
    FileType: joi.string(),
    CreatedAt: joi.date(),
    LastModifiedAt: joi.date(),
    OwnerUserId: joi.string(),
    GeneratedFileId: joi.string().uuid(),
    GeneratedFile: GeneratedUserFileSchema,
    UploadedMediaAssetVersions: joi.array().items(uploadedMediaAssetSchema),
    UploadUrls: joi.array().items(joi.string()),
    CreatedByUserId: joi.string(),
    LastModifiedByUserId: joi.string().email(),
    UploadUrl: joi.string(),
    oldId: joi.string(),
  })
  .meta({ className: 'UserFile' });

export default UserFileSchema;

export const CreateUserFileRequestSchema = joi
  .object({
    UserFamilyMemberId: joi.string().uuid().allow(''),
    Title: joi.string().required(),
    Description: joi.string().allow(''),
    GeneratedFileId: joi.string(),
    CaseCriterionId: joi.string().uuid(),
    ForUserId: joi.string().uuid(),
    DeletedFiles: joi.array().items(joi.string()),
    FileType: joi.string().allow(''),
    FilesOrder: joi.array().items(joi.object({ old: joi.boolean().required(), id: joi.string().required() })),
    Files: joi
      .array()
      .items(
        joi.object({
          id: joi.string().required(),
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
    CaseCriterionId: joi.string().uuid(),
    ForUserId: joi.string().uuid(),
    PageNumber: joi.number(),
    UserFamilyMemberId: joi.string().uuid(),
    Title: joi.string(),
  })
  .meta({ className: 'UpdateUserFileRequest' });

export const UpdateUserFileResponseSchema = UserFileSchema.meta({ className: 'UpdateUserFileResponse' });

export const GetUserFilesResponseSchema = joi.array().items(UserFileSchema).meta({ className: 'GetUserFilesResponse' });

export const GetUserFileTypeResponseSchema = joi
  .array()
  .items(
    joi.object({
      documentName: joi.string().required(),
      documentGroup: joi.string().required(),
    }),
  )
  .required()
  .meta({ className: 'GetUserFileTypesResponse' });

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

export const GetGeneratedFileByIdResponse = GeneratedUserFileSchema;

export const UpdateGeneratedFileRequestSchema = joi
  .object({
    id: joi.string().uuid().required(),
    ContentType: joi.string(),
    Description: joi.string().allow(''),
    FileType: joi.string(),
    File: joi.object({}),
    OriginalFilename: joi.string(),
    Status: joi.string(),
    SizeInBytes: joi.number(),
    Title: joi.string(),
  })
  .meta({ className: 'UpdateGeneratedFileRequest' });

export const UpdateGeneratedFileResponseSchema = GeneratedUserFileSchema.meta({
  className: 'UpdateGeneratedFileResponse',
});
