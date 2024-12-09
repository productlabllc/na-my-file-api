import { join } from 'path';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { ConfigRouteEntry } from 'aws-lambda-api-tools';

export default [
  // Workflow Routes
  {
    description: 'Get activity log types',
    swaggerMethodName: 'getActivityLogTypes',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'lookups/get-activity-log-types'),
    method: 'GET',
    path: `${routesBaseUrlPath}/lookups/activity-log-types`,
  },
] as Array<ConfigRouteEntry>;
