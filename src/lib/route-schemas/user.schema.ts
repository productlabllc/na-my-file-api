import joi = require('joi');
import { CaseActivityLogsSchema, PlatformActivityLogsSchema } from './platform-activity.schema';
import { BasePlatformActivityLogsSchema } from './base-models.schema';
import { CaseTeamAssignmentSchema } from './case.schema';
import { FamilyMemberSchema } from './family-member.schema';

export const UserSchema = joi
  .object({
    id: joi.string().uuid(),
    FirstName: joi.string(),
    LastName: joi.string(),
    Email: joi.string().email(),
    DOB: joi.date(),
    LegacyId: joi.string(),
    IdpId: joi.string(),
    PlatformActivityLogs: joi.array().items(BasePlatformActivityLogsSchema),
    LanguageIsoCode: joi.string(),
    TOSAcceptedAt: joi.date(),
    TOSAccepted: joi.boolean(),
  })
  .meta({ className: 'User' });

export const CreateUserRequestSchema = joi
  .object({
    FirstName: joi.string().required(),
    LastName: joi.string().required(),
    Email: joi.string().email().required(),
    DOB: joi.date().required(),
    LanguageIsoCode: joi.string(),
  })
  .meta({ className: 'CreateUserRequest' });

export const CreateUserResponseSchema = UserSchema.meta({ className: 'CreateUserResponse' });

export const UpdateUserRequestSchema = joi
  .object({
    FirstName: joi.string(),
    LastName: joi.string(),
    Email: joi.string().email(),
    DOB: joi.date().allow(null),
    LanguageIsoCode: joi.string(),
    TOSAcceptedAt: joi.date(),
    TOSAccepted: joi.boolean(),
    PPAcceptedAt: joi.date(),
  })
  .meta({ className: 'UpdateUserRequest' });

export const UpdateUserResponseSchema = UserSchema.meta({ className: 'UpdateUserResponse' });

export const GetUserActivityQuerySchema = joi
  .object({
    activityTypes: joi.string(),
    from: joi.date(),
    to: joi.date().default(new Date()),
    page: joi.number().min(1).default(1),
    pageSize: joi.number().min(10).default(50),
  })
  .meta({ className: 'GetUserActivityQuery' });

export const GetUserActivityResponseSchema = joi
  .object({
    items: joi.array().items(CaseActivityLogsSchema),
    total: joi.number(),
    take: joi.number(),
    skip: joi.number(),
    totalPages: joi.number(),
  })
  .meta({
    className: 'GetUserActivityResponse',
  });

export const GetUserActivitiesResponseSchema = joi
  .object({
    items: joi.array().items(PlatformActivityLogsSchema),
    currentPage: joi.number(),
    pageSize: joi.number(),
    total: joi.number(),
    totalPages: joi.number(),
  })
  .meta({ className: 'GetUserActivitiesResponse' });

export const UserCaseItem = joi.object({
  id: joi.string().uuid(),
  FirstName: joi.string(),
  LastName: joi.string(),
  Email: joi.string().email(),
  DOB: joi.date(),
  LegacyId: joi.string(),
  IdpId: joi.string(),
  LanguageIsoCode: joi.string(),
  TOSAcceptedAt: joi.date(),
  TOSAccepted: joi.boolean(),
  CaseTeamAssignments: joi.array().items(CaseTeamAssignmentSchema),
});

export const GetUsersCasesSchema = joi.array().items(UserCaseItem).meta({ className: 'GetUsesCases' });

export const GetUserSchema = joi
  .object({
    id: joi.string().uuid(),
    FirstName: joi.string(),
    LastName: joi.string(),
    Email: joi.string().email(),
    DOB: joi.date(),
    LegacyId: joi.string(),
    IdpId: joi.string(),
    LanguageIsoCode: joi.string(),
    TOSAcceptedAt: joi.date(),
    TOSAccepted: joi.boolean(),
    CaseTeamAssignments: joi.array().items(CaseTeamAssignmentSchema),
    UserFamilyMembers: joi.array().items(FamilyMemberSchema),
  })
  .meta({ className: 'GetUser' });
