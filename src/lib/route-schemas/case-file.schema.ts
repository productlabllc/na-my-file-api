import joi = require('joi');
import { GeneratedUserFileSchema } from './user-file.schema';
import { CASE_FILE_STATUS } from '../constants';

export const AddCaseFileRequestSchema = joi
  .object()
  .keys({
    GeneratedFileIds: joi.array().items(joi.string().uuid()).required(),
    CaseCriterionId: joi.string(),
  })
  .meta({ className: 'AddCaseFileRequest' });

export const DeleteCaseFileRequestSchema = joi
  .object({
    GeneratedFileIds: joi.array().items(joi.string().uuid().required()).required(),
    CaseCriterionId: joi.string(),
  })
  .meta({ className: 'DeleteCaseFileRequest' });

export const LogPreviewCaseFileSchema = joi
  .object({
    caseFileId: joi.string().uuid().required(),
  })
  .meta({ className: 'LogPreviewCaseFile' });
export const LogDownloadCaseFilesSchema = joi
  .object({
    caseFileIds: joi.array().items(joi.string().uuid()).required(),
  })
  .meta({ className: 'LogDownloadCaseFile' });

export const UpdateCaseFileRequestSchema = joi
  .object({
    Status: joi.string().allow(...Object.values(CASE_FILE_STATUS)),
    ReasonForResubmit: joi.string(),
  })
  .meta({ className: 'UpdateCaseFileRequest' });

export const LogViewCaseFamilyMemberSchema = joi
  .object({
    CaseId: joi.string().required(),
  })
  .meta({ className: 'LogViewCaseFamilyMember' });

export const GetCaseFileListingResponseSchema = joi
  .array()
  .items(
    joi.object({
      id: joi.string().uuid().required(),
      ReasonForResubmit: joi.string(),
      Status: joi
        .string()
        .allow(...Object.values(CASE_FILE_STATUS))
        .required(),
      GeneratedFile: GeneratedUserFileSchema,
    }),
  )
  .meta({ className: 'GetCaseListingResponse' });
