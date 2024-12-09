import { join } from 'path';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { ConfigRouteEntry } from 'aws-lambda-api-tools';

export default [
  /* User Routes */
  {
    description: 'Create user.',
    swaggerMethodName: 'createUser',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'users/create-user'),
    method: 'POST',
    path: `${routesBaseUrlPath}/users`,
  },
  {
    description: 'Get NYCID user data',
    swaggerMethodName: 'getUser',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'users/get-user-by-token'),
    method: 'GET',
    path: `${routesBaseUrlPath}/users`,
  },
  {
    description: 'Update user.',
    swaggerMethodName: 'updateUser',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'users/update-user'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/users`,
  },
  {
    description: 'Get user activity.',
    swaggerMethodName: 'getUserActivity',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'users/get-user-activity'),
    method: 'GET',
    path: `${routesBaseUrlPath}/users/activities`,
  },
  {
    description: 'Delete user',
    swaggerMethodName: 'deleteUser',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'users/delete-user'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/users`,
  },
] as Array<ConfigRouteEntry>;
