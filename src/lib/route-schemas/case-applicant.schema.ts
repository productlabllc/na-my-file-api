import * as Joi from 'joi';

export const CaseApplicantSchema = Joi.object({
  CaseId: Joi.string().uuid(),
  UserFamilyMemberId: Joi.string().uuid(),
  UserFamilyMember: Joi.object(),
  Case: Joi.object(),
}).meta({ className: 'CaseApplicant' });

export const AddCaseApplicantsRequestSchema = Joi.array()
  .items(Joi.object({ UserFamilyMemberId: Joi.string().uuid().required() }))
  .meta({ className: 'AddCaseApplicantsRequest' });

export const AddCaseApplicantsResponseSchema = CaseApplicantSchema;

export const DeleteCaseApplicantsRequestSchema = Joi.array()
  .items(Joi.object({ UserFamilyMemberId: Joi.string().uuid().required() }))
  .meta({ className: 'DeleteCaseApplicantsRequest' });

export const DeleteCaseResponseSchema = Joi.object({}).meta({ className: 'DeleteCaseApplicantResponse' });
