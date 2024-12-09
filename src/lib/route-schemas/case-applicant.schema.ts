import Joi = require('joi');
import { BaseCaseSchema, BaseFamilyMemberSchema } from './base-models.schema';

export const CaseApplicantSchema = Joi.object({
  CaseId: Joi.string().uuid(),
  UserFamilyMemberId: Joi.string().uuid(),
  UserFamilyMember: BaseFamilyMemberSchema,
  Case: BaseCaseSchema,
}).meta({ className: 'CaseApplicant' });

export const AddCaseFamilyMembersRequestSchema = Joi.array()
  .items(Joi.object({ UserFamilyMemberId: Joi.string().uuid().required() }))
  .meta({ className: 'AddCaseFamilyMembersRequest' });

export const AddCaseApplicantsResponseSchema = CaseApplicantSchema.meta({ className: 'AddCaseApplicantsResponse' });

export const DeleteCaseFamilyMembersRequestSchema = Joi.array()
  .items(Joi.object({ UserFamilyMemberId: Joi.string().uuid().required() }))
  .meta({ className: 'DeleteCaseFamilyMembersRequest' });

export const DeleteCaseApplicantResponseSchema = Joi.object({}).meta({ className: 'DeleteCaseApplicantResponse' });
