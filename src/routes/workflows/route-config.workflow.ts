import { join } from 'path';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { ConfigRouteEntry } from 'aws-lambda-api-tools';

export default [
  // Workflow Routes
  {
    description: 'Get myfile workflows',
    swaggerMethodName: 'getWorkflows',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'workflows/get-workflows'),
    method: 'GET',
    path: `${routesBaseUrlPath}/workflows`,
  },
] as Array<ConfigRouteEntry>;
