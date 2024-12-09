import { ActivityLogTypesList } from '../types-and-interfaces';
import { ACTIVITY_LOG_ENTITIES, CASE_CRITERION_FULFILLMENT_STATUS, CASE_FILE_STATUS } from '../constants';
import joi = require('joi');
import { STAKEHOLDER_GROUP_ROLES } from '../constants';

export const CaseAttributeSchema = joi
  .array()
  .items(
    joi.object({
      name: joi.string().required(),
      value: joi.string().required(),
    }),
  )
  .meta({ className: 'CaseAttributes' });

export const StakeholderGroupRole = joi
  .object({
    id: joi.string().uuid(),
    StakeholderGroupId: joi.string().uuid(),
    Name: joi.string().valid(...Object.values(STAKEHOLDER_GROUP_ROLES)),
    Description: joi.string(),
  })
  .meta({ className: 'StakeholderGroupRole' });

export const UserStakeholderGroupRole = joi
  .object({
    id: joi.string().uuid(),
    StakeholderGroupRoleId: joi.string().uuid(),
    UserId: joi.string().uuid(),
    CreatedAt: joi.date(),
    StakeholderGroupRole,
  })
  .meta({ className: 'UserStakeholderGroupRole' });

export const BaseUserSchema = joi
  .object({
    id: joi.string().uuid(),
    FirstName: joi.string(),
    LastName: joi.string(),
    Email: joi.string().email(),
    DOB: joi.date(),
    LegacyId: joi.string(),
    IdpId: joi.string(),
    PlatformActivityLogs: joi.array().items(joi.object({})),
    LanguageIsoCode: joi.string(),
    TOSAcceptedAt: joi.date(),
    TOSAccepted: joi.boolean(),
    StakeholderGroupRoles: joi.array().items(UserStakeholderGroupRole),
  })
  .meta({ className: 'UserBase' });

export const BasePlatformActivityLogsSchema = joi
  .object({
    id: joi.string().uuid().required(),
    ActivityType: joi
      .string()
      .valid(...ActivityLogTypesList)
      .required(),
    ActivityValue: joi.string().required(),
    CreatedAt: joi.date(),
    RelatedEntity: joi
      .string()
      .valid(...ACTIVITY_LOG_ENTITIES)
      .required(),
    ActivityGeneratedByUserId: joi.string().uuid(),
    User: BaseUserSchema,
  })
  .meta({ className: 'BasePlatformActivityLogs' });

export const BaseWorkFlowSchema = joi
  .object({
    id: joi.string().uuid().required(),
    Name: joi.string(),
    Type: joi.string(),
    Description: joi.string().allow(''),
  })
  .meta({ className: 'BaseWorkflow' });

export const BaseWorkflowStage = joi
  .object({
    id: joi.string().uuid().required(),
    StageName: joi.string(),
    StagePosition: joi.string(),
    WorkflowId: joi.string().uuid(),
    Workflow: BaseWorkFlowSchema,
  })
  .meta({ className: 'BaseWorkflowStage' });

export const BaseWorkflowStageCriterionSchema = joi
  .object({
    id: joi.string().uuid().required(),
    CaseWorkflowStageId: joi.string().uuid(),
    Name: joi.string(),
    CaseCriteria: joi.array().items(joi.object()),
    CriterionSubGroupName: joi.string(),
    CriterionGroupName: joi.string(),
    CriterionFulfillmentType: joi.string(),
    WorkflowStage: BaseWorkflowStage,
  })
  .meta({ className: 'BaseWorkflowStageCriterion' });

export const BaseFamilyMemberSchema = joi
  .object({
    id: joi.string().uuid().required(),
    FirstName: joi.string(),
    LastName: joi.string(),
    UserId: joi.string().uuid(),
    DOB: joi.date(),
    Relationship: joi.string(),
    User: BaseUserSchema,
  })
  .meta({ className: 'BaseFamilyMember' });

export const BaseUploadedMediaAssetVersionSchema = joi
  .object({
    id: joi.string().uuid(),
    ContentType: joi.string(),
    SizeInBytes: joi.string(),
    OriginalFilename: joi.string(),
    CreatedAt: joi.string(),
    LastModifiedAt: joi.string(),
    CreatedByUserId: joi.string(),
    LastModifiedByUserId: joi.string(),
    UserFileId: joi.string(),
    DeletedAt: joi.string(),
  })
  .meta({ className: 'BaseUploadedMediaAssetVersion' });

export const BaseUserFileSchema = joi
  .object({
    id: joi.string().uuid(),
    LegacyId: joi.string(),
    ContentType: joi.string().required(),
    ActiveVersionId: joi.string().uuid(),
    FileType: joi.string(),
    OriginalFilename: joi.string().required(),
    Title: joi.string().required(),
    CreatedAt: joi.date(),
    LastModifiedAt: joi.date(),
    FilePath: joi.string(),
    FileUploadedAt: joi.date(),
    Description: joi.string().allow(''),
    User: BaseUserSchema,
    UserFamilyMember: BaseFamilyMemberSchema,
    OwnerUserId: joi.string(),
    UploadedMediaAssetVersions: joi.array().items(BaseUploadedMediaAssetVersionSchema),
    UploadUrls: joi.array().items(joi.string()),
    CreatedByUserId: joi.string(),
    LastModifiedByUserId: joi.string().email(),
  })
  .meta({ className: 'BaseUserFile' });

export const BaseGeneratedUserFileSchema = joi
  .object({
    id: joi.string().uuid().required(),
    ContentType: joi.string(),
    OriginalFilename: joi.string(),
    Status: joi.string(),
    FamilyMemberId: joi.string(),
    Description: joi.string().allow(''),
    FileType: joi.string(),
    CaseFiles: joi.array().items(joi.object()),
    CreatedByUserId: joi.string(),
    CreatedByAgentUserId: joi.string(),
    CreatedByUser: BaseUserSchema,
    CreatedByAgentUser: BaseUserSchema,
    SizeInBytes: joi.number(),
    CreatedAt: joi.date(),
    LastModifiedAt: joi.date(),
    UserFamilyMember: BaseFamilyMemberSchema,
    FromUserFiles: joi.array().items(BaseUserFileSchema),
    Title: joi.string(),
  })
  .meta({ className: 'BaseGeneratedUserFile' });

export const BaseCaseFileSchema = joi
  .object({
    id: joi.string().uuid().required(),
    GeneratedFileId: joi.string().uuid(),
    GeneratedFile: BaseGeneratedUserFileSchema,
    CaseCriterionId: joi.string().uuid(),
    CreatedByAgentUserId: joi.string().uuid(),
    CreatedByAgentUser: BaseUserSchema,
    ReasonForResubmit: joi.string(),
    Status: joi
      .string()
      .allow(...Object.values(CASE_FILE_STATUS))
      .required(),
    CreatedByUserId: joi.string().uuid(),
    CaseId: joi.string().uuid(),
    CreatedAt: joi.date(),
    imagesAvailable: joi.boolean(),
  })
  .meta({ className: 'BaseCaseFile' });

export const BaseCaseCriterionSchema = joi
  .object({
    id: joi.string().uuid().required(),
    Status: joi.string(),
    LastModifiedByUserId: joi.string(),
    CaseId: joi.string(),
    UserId: joi.string(),
    Index: joi.string(),
    CaseFiles: joi.array().items(BaseCaseFileSchema),
    RuleSets: joi.any(),
    CriterionGroupName: joi.string(),
    CriterionSubGroupName: joi.string(),
    CriterionFulfillmentType: joi.string(),
    CriterionFulfillmentStatus: joi.string().allow(...Object.values(CASE_CRITERION_FULFILLMENT_STATUS)),
    Name: joi.string(),
    WorkflowStageCriterionId: joi.string(),
    WorkflowStageCriterion: BaseWorkflowStageCriterionSchema,
    LastModifiedByUser: BaseUserSchema,
    CreatedAt: joi.date(),
  })
  .meta({ className: 'BaseCaseCriterion' });

export const BaseCaseNoteSchema = joi
  .object({
    id: joi.string().uuid().required(),
    NoteText: joi.string(),
    ParentNoteId: joi.string(),
    AuthorUserId: joi.string().uuid(),
    NoteAudienceScope: joi.string(),
    AuthorUser: BaseUserSchema,
    CaseId: joi.string().uuid(),
    CreatedAt: joi.date(),
  })
  .meta({ className: 'BaseCaseNote' });

export const BaseCaseSchema = joi
  .object({
    Title: joi.string(),
    id: joi.string().uuid().required(),
    CaseType: joi.string(),
    PercentComplete: joi.number(),
    SSN: joi.string(),
    AgencyCaseIdentifier: joi.string(),
    CaseNotes: joi.array().items(BaseCaseNoteSchema),
    CaseCriteria: joi.array().items(BaseCaseCriterionSchema),
    CaseAttributes: CaseAttributeSchema,
  })
  .meta({ className: 'BaseCase' });

export const BaseCasePrimitivesSchema = joi
  .object({
    Title: joi.string(),
    id: joi.string().uuid().required(),
    CaseType: joi.string(),
    PercentComplete: joi.number(),
    SSN: joi.string(),
    CaseAttributes: CaseAttributeSchema,
  })
  .meta({ className: 'BaseCasePrimitives' });
