import { ConfigRouteEntry } from 'aws-lambda-api-tools';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const caseCriterionRouteConfig = [
  {
    description: 'Update Case Criterion',
    swaggerMethodName: 'updateCaseCriterion',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-criteria/update-criterion'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/cases/criterion`,
  },
  {
    description: 'Get Criterion Case files',
    swaggerMethodName: 'getCriteriaCaseFiles',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-criteria/get-criterion-case-files'),
    method: 'GET',
    path: `${routesBaseUrlPath}/cases/criteria/{caseCriterionId}/files`,
  },
  {
    description: 'Delete case criterion',
    swaggerMethodName: 'removeCaseCriterionAdmin',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-criteria/remove-case-criterion'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/case/criteria/{caseCriterionId}`,
  },
  {
    description: 'Approve Checklist (Workflow stage)',
    swaggerMethodName: 'approveChecklist',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-criteria/approve-criteria'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/case/{caseId}/criteria/{workflowStageId}/approve`,
  },
] as Array<ConfigRouteEntry>;

export default caseCriterionRouteConfig;
