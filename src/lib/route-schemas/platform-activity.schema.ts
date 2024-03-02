import * as Joi from 'joi';

export const PlatformActivityLogsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  ActivityType: Joi.string(),
  ActivityValue: Joi.string(),
  RelatedId: Joi.string().uuid(),
  CreatedAt: Joi.date(),
  ActivityGeneratedByUserId: Joi.string().uuid(),
  Metadata: Joi.object(),
  User: Joi.object(),
}).meta({ className: 'PlatformActivityLogs' });
