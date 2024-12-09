import Joi = require('joi');
import userFileSchema, { GeneratedUserFileSchema } from './user-file.schema';
import { CaseApplicantSchema } from './case-applicant.schema';
import {
  BaseCaseFileSchema,
  BaseCaseNoteSchema,
  BaseCaseSchema,
  CaseAttributeSchema,
  BaseUserSchema,
  BaseCasePrimitivesSchema,
} from './base-models.schema';
import { WorkflowStageCriterionSchema } from './workflow.schema';
import { CASE_CRITERION_FULFILLMENT_STATUS, CASE_FILE_STATUS, CASE_STATUS } from '../constants';
import { UserSchema } from './user.schema';

export const CaseNoteSchema = Joi.object({
  id: Joi.string().uuid().required(),
  NoteText: Joi.string(),
  ParentNoteId: Joi.string(),
  AuthorUserId: Joi.string().uuid(),
  NoteAudienceScope: Joi.string(),
  AuthorUser: BaseUserSchema,
  CaseId: Joi.string().uuid(),
  CaseNoteReplies: Joi.array().items(BaseCaseNoteSchema),
  CaseNote: BaseCaseNoteSchema,
  CreatedAt: Joi.date(),
}).meta({ className: 'CaseNote' });

export const AddCaseNoteRequestSchema = Joi.object({
  NoteText: Joi.string().required(),
  ParentNodeId: Joi.string().allow(''),
  NoteAudienceScope: Joi.string().allow(''),
  CaseId: Joi.string().required(),
}).meta({ className: 'AddCaseNoteRequest' });

export const UpdateCaseNoteRequestSchema = Joi.object({
  NoteText: Joi.string().required(),
  id: Joi.string().required(),
}).meta({ className: 'UpdateCaseNoteRequest' });

export const UpdateCaseCriterionSchema = Joi.object({
  CriterionFulfillmentStatus: Joi.string()
    .valid(...Object.values(CASE_CRITERION_FULFILLMENT_STATUS))
    .required(),
  Name: Joi.string().allow(''),
  CriterionSubGroupName: Joi.string().allow(''),
  CriterionGroupName: Joi.string().allow(''),
}).meta({ className: 'UpdateCaseCriterion' });

export const GetCaseNotesResponseSchema = Joi.array().items(CaseNoteSchema).meta({
  className: 'GetCaseNotesResponse',
});

export const CaseCriterionSchema = Joi.object({
  id: Joi.string().uuid().required(),
  Status: Joi.string(),
  LastModifiedByUserId: Joi.string(),
  CaseId: Joi.string(),
  RuleSets: Joi.any(),
  Index: Joi.string(),
  CaseFiles: Joi.array().items(BaseCaseFileSchema),
  UserId: Joi.string(),
  WorkflowStageCriterionId: Joi.string(),
  LastModifiedByUser: BaseUserSchema,
  CriterionGroupName: Joi.string(),
  CriterionSubGroupName: Joi.string(),
  CriterionFulfillmentType: Joi.string(),
  CriterionFulfillmentStatus: Joi.string().allow(...Object.values(CASE_CRITERION_FULFILLMENT_STATUS)),
  Name: Joi.string(),
  Case: BaseCaseSchema,
  CreatedAt: Joi.date(),
  WorkflowStageCriterion: WorkflowStageCriterionSchema,
}).meta({ className: 'CaseCriterion' });

export const CaseCriteriaSchema = Joi.array().items(CaseCriterionSchema).meta({ className: 'CaseCriteria' });

export const CaseFileSchema = Joi.object({
  id: Joi.string().uuid().required(),
  UserFileId: Joi.string().uuid(),
  CreatedByUserId: Joi.string().uuid(),
  CaseId: Joi.string().uuid(),
  ReasonForResubmit: Joi.string(),
  CreatedByAgentUserId: Joi.string().uuid(),
  CreatedByAgentUser: BaseUserSchema,
  Status: Joi.string()
    .allow(...Object.values(CASE_FILE_STATUS))
    .required(),
  Case: BaseCaseSchema,
  CreatedAt: Joi.date(),
  CaseCriterionId: Joi.string(),
  CaseCriterion: CaseCriterionSchema,
  GeneratedFile: GeneratedUserFileSchema,
}).meta({ className: 'CaseFile' });

export const CriteriaCaseFilesResponse = Joi.array().items(
  CaseFileSchema.keys({
    imagesAvailable: Joi.boolean(),
  }),
);

export const CaseTeamAssignmentSchema = Joi.object({
  id: Joi.string().uuid().required(),
  CreatedAt: Joi.date(),
  UserId: Joi.string().uuid(),
  CaseId: Joi.string().uuid(),
  CaseRole: Joi.string(),
  Case: BaseCaseSchema,
  User: BaseUserSchema,
}).meta({ className: 'CaseTeamAssignment' });

export const CaseTeamAssignmentWithCasePrimitives = Joi.object({
  id: Joi.string().uuid().required(),
  CreatedAt: Joi.date(),
  UserId: Joi.string().uuid(),
  CaseId: Joi.string().uuid(),
  CaseRole: Joi.string(),
  Case: BaseCasePrimitivesSchema,
  User: BaseUserSchema,
}).meta({ className: 'CaseTeamAssignmentWithCasePrimitives' });

export const CaseSchema = Joi.object({
  Title: Joi.string(),
  id: Joi.string().uuid().required(),
  CaseType: Joi.string(),
  PercentComplete: Joi.number(),
  Status: Joi.string(),
  AgencyCaseIdentifier: Joi.string(),
  SSN: Joi.string(),
  CaseAttributes: CaseAttributeSchema,
  CaseCriteria: Joi.array().items(CaseCriterionSchema),
  CaseNotes: Joi.array().items(CaseNoteSchema),
  CaseTeamAssignments: Joi.array().items(CaseTeamAssignmentSchema),
  CaseFiles: Joi.array().items(CaseFileSchema),
  CaseApplicants: Joi.array().items(CaseApplicantSchema),
  CreatedAt: Joi.date(),
}).meta({ className: 'Case' });

export const CreateCaseRequestBodySchema = Joi.object({
  CaseTitle: Joi.string(),
  CaseType: Joi.string().required(),
  SSN: Joi.string().allow(''),
  CaseAttributes: CaseAttributeSchema,
  CaseIdentifier: Joi.string().allow(''),
  FamilyMemberIds: Joi.array().items(Joi.string().uuid()),
  WorkflowId: Joi.string().uuid().required(),
}).meta({ className: 'CreateCaseRequestBody' });

export const UpdateCaseRequestBodySchema = Joi.object({
  CaseTitle: Joi.string(),
  CaseType: Joi.string(),
  SSN: Joi.string().allow(''),
  PercentComplete: Joi.number(),
  CaseAttributes: CaseAttributeSchema,
  Status: Joi.string().valid(...Object.values(CASE_STATUS)),
  AgencyCaseIdentifier: Joi.string(),
}).meta({ className: 'UpdateCaseRequestBody' });

export const UpdateCaseResponseSchema = CaseSchema.meta({ className: 'UpdateCaseResponse' });

export const CreateCaseResponseSchema = CaseSchema.meta({ className: 'CreateCaseResponse' });

export const GetCaseResponseSchema = CaseSchema.meta({ className: 'GetCaseResponse' });

export const GetCasesResponseSchema = Joi.array().items(CaseSchema).meta({ className: 'GetCasesResponse' });

export const GetCaseUserFileResponseSchema = Joi.array()
  .items(GeneratedUserFileSchema)
  .meta({ className: 'GetCaseUserFilesResponse' });

export const GetUserFileCasesResponseSchema = Joi.array()
  .items(CaseSchema)
  .meta({ className: 'GetUserFileCasesResponse' });
