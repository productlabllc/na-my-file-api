import { join } from 'path';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { ConfigRouteEntry } from 'aws-lambda-api-tools';

export default [
  // Activities Routes
  {
    description: 'Get User Activities',
    swaggerMethodName: 'getActivitiesForUser',
    generateOpenApiDocs: true,
    method: 'GET',
    handlerPath: join(routesSourceBaseDirectory, 'activities/get-activity-by-user-id'),
    path: `${routesBaseUrlPath}/activities/users/{userId}`,
  },
  {
    description: 'Update Case Activity Log read status',
    swaggerMethodName: 'updateCaseActivityLogReadStatus',
    generateOpenApiDocs: true,
    method: 'PATCH',
    path: `${routesBaseUrlPath}/activities/case`,
    handlerPath: join(routesSourceBaseDirectory, 'activities/mark-case-activity-as-seen'),
  },
] as Array<ConfigRouteEntry>;
