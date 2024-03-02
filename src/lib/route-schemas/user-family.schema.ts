import * as Joi from 'joi';
import userSchema from './user.schema';
import { CaseApplicantSchema } from './case.schema';
import userFileSchema from './user-file.schema';

export const UserFamilySchema = Joi.object({
  id: Joi.string().uuid().required(),
  FirstName: Joi.string(),
  LastName: Joi.string(),
  UserId: Joi.string().uuid(),
  DOB: Joi.date(),
  Relationship: Joi.string(),
  User: userSchema,
  CaseApllicants: Joi.array().items(CaseApplicantSchema),
  UserFiles: Joi.array().items(userFileSchema),
}).meta({ className: 'UserFamily' });

export const CreateUserFamilyRequestSchema = Joi.object({
  FirstName: Joi.string().required(),
  LastName: Joi.string().required(),
  DOB: Joi.date().required(),
  Relationship: Joi.string().required(),
}).meta({ className: 'CreateFamilyMemberRequest' });

export const UpdateUserFamilyRequestSchema = Joi.object({
  FirstName: Joi.string(),
  id: Joi.string().uuid().required(),
  LastName: Joi.string(),
  Dob: Joi.date(),
  Relationship: Joi.string(),
}).meta({ className: 'UpdateUserFamilyRequest' });

export const DeleteFamilyMemberRequestSchema = Joi.array()
  .items(Joi.string().uuid())
  .meta({ className: 'DeleteFamilyMemberRequest' });

export const DeleteUsersFamilyResponseSchema = Joi.array()
  .items(UserFamilySchema)
  .meta({ className: 'DeleteUsersFamilyResponse' });

export const UpdateUserFamilyResponseSchema = UserFamilySchema;

export const CreateUserFamilyResponseSchema = UserFamilySchema;
