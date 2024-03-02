import { ConfigRouteEntry } from '@myfile/core-sdk';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const routes = [
  {
    // Can be used to add 1
    description: 'Add case files',
    swaggerMethodName: 'addCaseFiles',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-files/add-case-files'),
    method: 'POST',
    path: `${routesBaseUrlPath}/cases/{caseId}/files`,
  },
  {
    // Can be used to delete 1
    description: 'Delete case files',
    swaggerMethodName: 'deleteCaseFiles',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-files/remove-case-files'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/cases/{caseId}/files`,
  },
  {
    description: 'Get user files for a case',
    swaggerMethodName: 'getCaseFiles',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-files/get-case-user-files'),
    method: 'GET',
    path: `${routesBaseUrlPath}/cases/{caseId}/files`,
  },
] as Array<ConfigRouteEntry>;

export default routes;
