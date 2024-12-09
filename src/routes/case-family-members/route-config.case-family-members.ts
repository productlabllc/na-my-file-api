import { ConfigRouteEntry } from 'aws-lambda-api-tools';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const caseFamilyMembersRoutes = [
  {
    // Can be used to add 1
    description: 'Add case family members',
    swaggerMethodName: 'addCaseFamilyMembers',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-family-members/add-case-family-members'),
    method: 'POST',
    path: `${routesBaseUrlPath}/case/{caseId}/family-members`,
  },
  {
    // Can be used to delete 1
    description: 'Delete case family members',
    swaggerMethodName: 'deleteCaseFamilyMembers',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-family-members/remove-case-family-members'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/case/{caseId}/family-members`,
  },
  {
    description: 'Get case family members',
    swaggerMethodName: 'getCaseFamilyMembers',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-family-members/get-case-family-members'),
    method: 'GET',
    path: `${routesBaseUrlPath}/case/{caseId}/family-members`,
  },
] as Array<ConfigRouteEntry>;

export default caseFamilyMembersRoutes;
