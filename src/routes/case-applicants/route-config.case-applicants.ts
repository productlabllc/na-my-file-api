import { ConfigRouteEntry } from '@myfile/core-sdk';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const caseApplicantsRoutes = [
  {
    // Can be used to add 1
    description: 'Add case applicants',
    swaggerMethodName: 'addCaseApplicants',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-applicants/add-case-applicants'),
    method: 'POST',
    path: `${routesBaseUrlPath}/case/{caseId}/applicants`,
  },
  {
    // Can be used to delete 1
    description: 'Delete case applicants',
    swaggerMethodName: 'deleteCaseApplicants',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-applicants/remove-case-applicants'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/case/{caseId}/applicants`,
  },
  {
    description: 'Get case applicants',
    swaggerMethodName: 'getCaseApplicants',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-applicants/get-case-applicants'),
    method: 'GET',
    path: `${routesBaseUrlPath}/case/{caseId}/applicants`,
  },
] as Array<ConfigRouteEntry>;

export default caseApplicantsRoutes;
