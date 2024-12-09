import { ConfigRouteEntry } from 'aws-lambda-api-tools';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const caseFilesRoutes = [
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
    description: 'Get case files',
    swaggerMethodName: 'getCaseFileListing',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-files/get-case-file-listing'),
    method: 'GET',
    path: `${routesBaseUrlPath}/cases/{caseId}/files`,
  },
  {
    description: 'Update case file',
    swaggerMethodName: 'updateCaseFile',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-files/update-case-file'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/cases/files/{id}`,
  },
  {
    description: 'Log download case files',
    swaggerMethodName: 'logCaseFilesDownload',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-files/log-download-case-files'),
    method: 'POST',
    path: `${routesBaseUrlPath}/cases/files/log-download`,
  },
  {
    description: 'Log preview cas file',
    swaggerMethodName: 'logPreviewCaseFile',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-files/log-preview-case-file'),
    method: 'POST',
    path: `${routesBaseUrlPath}/cases/files/log-preview`,
  },
] as Array<ConfigRouteEntry>;

export default caseFilesRoutes;
