import * as Joi from 'joi';
import { CaseFileSchema } from './case.schema';

export const AddCaseFileRequestSchema = Joi.object({
  UserFileIds: Joi.array().items(Joi.string().uuid()).required(),
}).meta({ className: 'AddCaseFileRequest' });

export const DeleteCaseFileRequestSchema = Joi.object({
  UserFileIds: Joi.array().items(Joi.string().uuid().required()).required(),
}).meta({ className: 'DeleteCaseFileRequest' });
