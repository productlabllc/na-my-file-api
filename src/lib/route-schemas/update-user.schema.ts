import joi = require('joi');

export default joi
  .object({
    FirstName: joi.string(),
    LastName: joi.string(),
    Email: joi.string().email(),
  })
  .meta({ className: 'UpdateUser' });
