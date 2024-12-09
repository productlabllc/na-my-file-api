import Joi = require('joi');
import { BaseCaseSchema, BaseUserSchema } from './base-models.schema';
import { ACTIVITY_LOG_ENTITIES } from '../constants';
import { ActivityLogTypesList } from '../types-and-interfaces';

export const PlatformActivityLogsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  ActivityType: Joi.string()
    .valid(...ActivityLogTypesList)
    .required(),
  ActivityValue: Joi.string().required(),
  CreatedAt: Joi.date(),
  RelatedEntity: Joi.string()
    .valid(...ACTIVITY_LOG_ENTITIES)
    .required(),
  ActivityGeneratedByUserId: Joi.string().uuid(),
  User: BaseUserSchema,
}).meta({ className: 'PlatformActivityLogs' });

export const CaseActivityLogsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  ActivityType: Joi.string()
    .valid(...ActivityLogTypesList)
    .required(),
  ActivityValue: Joi.string().required(),
  CreatedAt: Joi.date(),
  CaseId: Joi.string(),
  ActivityAcknowledgedByUserId: Joi.string(),
  ActivityAcknowledgedBy: BaseUserSchema,
  Case: BaseCaseSchema,
  User: BaseUserSchema,
  RelatedEntity: Joi.string()
    .valid(...ACTIVITY_LOG_ENTITIES)
    .required(),
  ActivityGeneratedByUserId: Joi.string().uuid(),
}).meta({ className: 'CaseActivityLogs' });

export const MarkCaseActivityAsReadSchema = Joi.object({
  caseId: Joi.string().uuid().required(),
  caseActivityLogId: Joi.string().uuid().required(),
  readStatus: Joi.boolean().required(),
}).meta({
  className: 'MarkCaseActivityAsRead',
});
