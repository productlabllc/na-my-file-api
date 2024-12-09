import joi = require('joi');

export const LanguageSchema = joi
  .object({
    id: joi.string().uuid().required(),
    Name: joi.string().required(),
    Code: joi.string().required(),
    CreatedAt: joi.date().required(),
  })
  .meta({ className: 'Language' });
