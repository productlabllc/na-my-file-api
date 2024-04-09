import Joi = require('joi');
import userSchema from './user.schema';
import userFileSchema from './user-file.schema';
import UserFileSchema from './user-file.schema';
import { CaseApplicantSchema } from './case-applicant.schema';

export const CaseAttributeSchema = Joi.array()
  .items(
    Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required(),
    }),
  )
  .meta({ className: 'CaseAttributes' });

export const CaseNoteSchema = Joi.object({
  id: Joi.string().uuid().required(),
  NoteText: Joi.string(),
  ParentNoteId: Joi.string(),
  AuthorUserId: Joi.string().uuid(),
  NoteAudienceScope: Joi.string(),
  AuthorUser: userSchema,
  CaseId: Joi.string().uuid(),
  CaseNoteReplies: Joi.array().items(Joi.object()),
  CaseNote: Joi.object(),
}).meta({ className: 'CaseNote' });

export const CaseCriterionSchema = Joi.object({
  id: Joi.string().uuid().required(),
  Status: Joi.string(),
  LastModifiedByUserId: Joi.string(),
  CaseId: Joi.string(),
  UserId: Joi.string(),
  WorkflowStageCriterionId: Joi.string(),
  LastModifiedByUser: Joi.object(),
  Case: Joi.object(),
  WorkflowStageCriterion: Joi.object(),
}).meta({ className: 'CaseCriterion' });

export const CaseFileSchema = Joi.object({
  id: Joi.string().uuid().required(),
  UserFileId: Joi.string().uuid(),
  CreatedByUserId: Joi.string().uuid(),
  CaseId: Joi.string().uuid(),
  Case: Joi.object(),
  UserFile: userFileSchema,
}).meta({ className: 'CaseFile' });

export const CaseTeamAssignmentSchema = Joi.object({
  id: Joi.string().uuid().required(),
  UserId: Joi.string().uuid(),
  CaseId: Joi.string().uuid(),
  CaseRole: Joi.string(),
  Case: Joi.object(),
  User: userSchema,
}).meta({ className: 'CaseTeamAssignment' });

export const CaseSchema = Joi.object({
  Title: Joi.string(),
  id: Joi.string().uuid().required(),
  CaseType: Joi.string(),
  PercentComplete: Joi.number(),
  AgencyCaseIdentifier: Joi.string(),
  CaseAttributes: CaseAttributeSchema,
  CaseCriteria: Joi.array().items(CaseCriterionSchema),
  CaseNotes: Joi.array().items(CaseNoteSchema),
  CaseTeamAssignments: Joi.array().items(CaseTeamAssignmentSchema),
  CaseFiles: Joi.array().items(CaseFileSchema),
  CaseApplicants: Joi.array().items(CaseApplicantSchema),
}).meta({ className: 'Case' });

export const CreateCaseRequestBodySchema = Joi.object({
  CaseTitle: Joi.string(),
  CaseType: Joi.string().required(),
  CaseAttributes: CaseAttributeSchema,
  CaseIdentifier: Joi.string().required(),
  FamilyMemberIds: Joi.array().items(Joi.string().uuid()),
  WorkflowId: Joi.string().uuid().required(),
}).meta({ className: 'CreateCaseRequestBody' });

export const UpdateCaseRequestBodySchema = Joi.object({
  CaseTitle: Joi.string(),
  CaseType: Joi.string(),
  PercentComplete: Joi.number(),
  CaseAttributes: CaseAttributeSchema,
  Status: Joi.string(),
  AgencyCaseIdentifier: Joi.string(),
}).meta({ className: 'UpdateCaseRequestBody' });

export const UpdateCaseResponseSchema = CaseSchema.meta({ className: 'UpdateCaseResponse' });

export const CreateCaseResponseSchema = CaseSchema.meta({ className: 'CreateCaseResponse' });

export const GetCaseResponseSchema = CaseSchema.meta({ className: 'GetCaseResponse' });

export const GetCasesResponseSchema = Joi.array().items(CaseSchema).meta({ className: 'getCaseResponse' });

export const GetCaseUserFileResponseSchema = Joi.array()
  .items(UserFileSchema)
  .meta({ className: 'GetCaseUserFilesResponse' });

export const GetUserFileCasesResponseSchema = Joi.array()
  .items(CaseSchema)
  .meta({ className: 'GetUserFileCasesResponse' });
