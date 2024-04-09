import Joi = require('joi');

export const ExampleSchema = {
  name: Joi.string().required().message('Name is required'),
  legal: Joi.string(),
  addressLine1: Joi.string().required().message('Address line 1 is required'),
  addressLine2: Joi.string(),
  city: Joi.string().required().message('City is required'),
  stateOrProvince: Joi.string().required().message('State is required'),
  postalCode: Joi.string().required().message('Zip is required'),
  country: Joi.string().required().message('Country is required'),
  lat: Joi.number().required().message('Latitude is required'),
  lng: Joi.number().required().message('Longitude is required'),
};
