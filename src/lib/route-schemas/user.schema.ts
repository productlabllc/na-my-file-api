import joi = require('joi');
import { PlatformActivityLogsSchema } from './platform-activity.schema';
import { WorkFlowSchema } from './workflow.schema';

const UserSchema = joi
  .object({
    id: joi.string().uuid(),
    FirstName: joi.string(),
    LastName: joi.string(),
    Email: joi.string().email(),
    LegacyId: joi.string(),
    IdpId: joi.string(),
  })
  .meta({ className: 'User' });

export default UserSchema;

export const CreateUserRequestSchema = joi
  .object({
    FirstName: joi.string().required(),
    LastName: joi.string().required(),
    Email: joi.string().email().required(),
    DOB: joi.date().required(),
    LanguageId: joi.string().uuid().required(),
    Workflows: joi.array().items(joi.string().uuid()),
  })
  .meta({ className: 'CreateUserRequest' });

export const CreateUserResponseSchema = UserSchema.meta({ className: 'CreateUserResponse' });

export const UpdateUserRequestSchema = joi
  .object({
    FirstName: joi.string(),
    LastName: joi.string(),
    Email: joi.string().email(),
    DOB: joi.date(),
    LanguageId: joi.string().uuid(),
    TOSAcceptedAt: joi.date(),
    PPAcceptedAt: joi.date(),
  })
  .meta({ className: 'UpdateUserRequest' });

export const UpdateUserResponseSchema = UserSchema.meta({ className: 'UpdateUserResponse' });

export const AddUserWorkFlowRequestSchema = joi
  .object({
    WorkflowId: joi.string().uuid().required(),
  })
  .meta({ className: 'AddWorkFlowRequest' });

export const AddUserWorkFlowResponseSchema = UserSchema.meta({ className: 'AddWorkFlowResponse' });

export const DeleteUserWorkFlowRequestSchema = joi
  .object({
    WorkflowId: joi.string().uuid().required(),
  })
  .meta({ className: 'DeleteWorkFlowRequest' });

export const DeleteUserWorkFlowResponseSchema = UserSchema.meta({ className: 'DeleteWorkFlowResponse' });

export const GetUserWorkFlowsResponseSchema = joi
  .array()
  .items(WorkFlowSchema)
  .meta({ className: 'GetUserWorkFlowsResponse' });

export const GetUserActivityQuerySchema = joi
  .object({
    filters: joi.object({
      fromDate: joi.date(),
      toDate: joi.date(),
    }),
    page: joi.number().min(1),
    limit: joi.number().min(10),
  })
  .meta({ className: 'GetUserActivityQuery' });

export const GetUserActivityResponseSchema = joi
  .object({
    items: joi.array().items(PlatformActivityLogsSchema),
    total: joi.number(),
    page: joi.number(),
    limit: joi.number(),
  })
  .meta({ className: 'GetUserActivityResponse' });
