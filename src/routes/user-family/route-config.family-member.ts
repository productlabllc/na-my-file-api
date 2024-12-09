import { ConfigRouteEntry } from 'aws-lambda-api-tools';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const familyMemberRoutes = [
  {
    description: 'Create a user family member',
    swaggerMethodName: 'createUserFamilyMember',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-family/create-user-family-member'),
    method: 'POST',
    path: `${routesBaseUrlPath}/user/family`,
  },
  {
    description: 'Update user family member',
    swaggerMethodName: 'updateUserFamilyMember',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-family/update-user-family-member'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/user/family`,
  },
  {
    description: 'Delete user family members',
    swaggerMethodName: 'deleteFamilyMember',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-family/delete-user-family-member'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/user/family`,
  },
  {
    description: 'Get user family member',
    swaggerMethodName: 'getFamilyMember',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-family/get-user-family-member'),
    method: 'GET',
    path: `${routesBaseUrlPath}/user/family/{id}`,
  },
  {
    description: 'Get user family members',
    swaggerMethodName: 'getFamilyMembers',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-family/get-user-family-members'),
    method: 'GET',
    path: `${routesBaseUrlPath}/user/family`,
  },
] as Array<ConfigRouteEntry>;

export default familyMemberRoutes;
