import joi = require('joi');

export default joi
  .object({
    id: joi.string().uuid(),
    ContentType: joi.string().required(),
    SizeInBytes: joi.number().required(),
    OriginalFilename: joi.string().required(),
    CreatedAt: joi.date(),
    LastModifiedAt: joi.date(),
    OwnerUserId: joi.string(),
    CreatedByUserId: joi.string(),
    LastModifiedByUserId: joi.string().email(),
  })
  .meta({ className: 'UploadedMediaAssetVersion' });
