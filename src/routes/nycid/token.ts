import Joi = require('joi');

import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import axios from 'axios';
import { getAxiosProxyConfiguration } from '../../lib/utils';



const routeSchema: RouteSchema = {
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  console.log('Input:');
  console.log(input);
  console.log('Body');
  console.log(input.body);
  const response = await axios({
    method: 'POST',
    url: 'https://nonprd-login.nyc.gov/oidc/op/v1.0/3_DkZigi2v_eW7z-cZt8PAw-cYWQYg2d8VqABUFRZUhhzxNAdwR5brLl_h8Hqbo7Bm/token',
    responseType: 'json',
    data: input.body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    proxy: getAxiosProxyConfiguration(),
  });
  console.log(response);
  return response.data;
};

const routeModule: RouteModule = {
  routeChain: [handler],
  routeSchema,
};

export default routeModule;
