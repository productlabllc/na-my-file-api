import { ConfigRouteEntry } from 'aws-lambda-api-tools';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const caseRoutes = [
  {
    description: 'Create a new case',
    swaggerMethodName: 'createCase',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'cases/create-case'),
    method: 'POST',
    path: `${routesBaseUrlPath}/cases`,
  },
  {
    description: 'Update a case',
    swaggerMethodName: 'updateCase',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'cases/update-case'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/cases/{caseId}`,
  },
  {
    description: 'Delete a case',
    swaggerMethodName: 'deleteCase',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'cases/delete-case'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/cases/{caseId}`,
  },
  {
    description: 'Get a single case',
    swaggerMethodName: 'getCase',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'cases/get-case-by-id'),
    method: 'GET',
    path: `${routesBaseUrlPath}/cases/{caseId}`,
  },
  {
    description: 'Get user cases',
    swaggerMethodName: 'getCases',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'cases/get-user-cases'),
    method: 'GET',
    path: `${routesBaseUrlPath}/cases`,
  },
  {
    description: 'Get User Cases Admin',
    swaggerMethodName: 'getUserCasesAdmin',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'cases/get-cases-by-user-id'),
    method: 'GET',
    path: `${routesBaseUrlPath}/cases/user/{userId}`,
  },
  {
    description: 'Log View Family Member',
    swaggerMethodName: 'logViewCaseFamilyMember',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'cases/log-view-case-family-member'),
    method: 'POST',
    path: `${routesBaseUrlPath}/cases/family-member/log-view`,
  },
] as Array<ConfigRouteEntry>;

export default caseRoutes;
