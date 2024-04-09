import Joi = require('joi');
import userSchema from './user.schema';
import { CaseApplicantSchema } from './case-applicant.schema';
import userFileSchema from './user-file.schema';

export const FamilyMemberSchema = Joi.object({
  id: Joi.string().uuid().required(),
  FirstName: Joi.string(),
  LastName: Joi.string(),
  UserId: Joi.string().uuid(),
  DOB: Joi.date(),
  Relationship: Joi.string(),
  User: userSchema,
  CaseApplicants: Joi.array().items(CaseApplicantSchema),
  UserFiles: Joi.array().items(userFileSchema),
}).meta({ className: 'FamilyMember' });

export const CreateFamilyMemberRequestSchema = Joi.object({
  FirstName: Joi.string().required(),
  LastName: Joi.string().required(),
  DOB: Joi.date().required(),
  Relationship: Joi.string().required(),
}).meta({ className: 'CreateFamilyMemberRequest' });

export const UpdateFamilyMemberRequestSchema = Joi.object({
  FirstName: Joi.string(),
  id: Joi.string().uuid().required(),
  LastName: Joi.string(),
  Dob: Joi.date(),
  Relationship: Joi.string(),
}).meta({ className: 'UpdateFamilyMemberRequest' });

export const DeleteFamilyMemberRequestSchema = Joi.array()
  .items(Joi.string().uuid())
  .meta({ className: 'DeleteFamilyMemberRequest' });

export const DeleteFamilymemberResponseSchema = Joi.array()
  .items(FamilyMemberSchema)
  .meta({ className: 'DeleteFamilyMemberResponse' });

export const UpdateFamilyMemberResponseSchema = FamilyMemberSchema.meta({ className: 'UpdateFamilyMemberResponse' });

export const CreateFamilyMemberResponseSchema = FamilyMemberSchema.meta({ className: 'CreateFamilyMemberResponse' });
