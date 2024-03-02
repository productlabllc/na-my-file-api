import { ConfigRouteEntry } from '@myfile/core-sdk';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { join } from 'path';

export default [
  {
    description: 'Add user workflow',
    swaggerMethodName: 'addUserWorkflow',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-workflows/add-user-workflow'),
    method: 'POST',
    path: `${routesBaseUrlPath}/users/workflows`,
  },
  {
    description: 'Remove user workflow',
    swaggerMethodName: 'removeUserWorkflow',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-workflows/remove-user-workflow'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/users/workflows`,
  },
  {
    description: 'Get user workflows',
    swaggerMethodName: 'getUserWorkflows',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-workflows/get-user-workflows'),
    method: 'GET',
    path: `${routesBaseUrlPath}/users/workflows`,
  },
] as Array<ConfigRouteEntry>;
