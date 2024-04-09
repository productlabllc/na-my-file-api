import joi = require('joi');

export const AddCaseFileRequestSchema = joi.object().keys({
  UserFileIds: joi.array().items(joi.string().uuid()).required(),
}).meta({ className: 'AddCaseFileRequest' });

export const DeleteCaseFileRequestSchema = joi.object({
  UserFileIds: joi.array().items(joi.string().uuid().required()).required(),
}).meta({ className: 'DeleteCaseFileRequest' });

export const UpdateCaseFileRequestSchema = joi.object({
  Status: joi.string().required(),
}).meta({ className: 'UpdateCaseFileRequest' });
