import { join } from 'path';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { ConfigRouteEntry } from 'aws-lambda-api-tools';

export default [
  // Workflow Routes
  {
    description: 'Get myfile languages',
    swaggerMethodName: 'getLanguages',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'languages/get-languages'),
    method: 'GET',
    path: `${routesBaseUrlPath}/languages`,
  },
] as Array<ConfigRouteEntry>;
