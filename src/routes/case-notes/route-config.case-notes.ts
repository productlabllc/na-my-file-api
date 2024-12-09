import { ConfigRouteEntry } from 'aws-lambda-api-tools';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const caseNotesRouteConfigs = [
  {
    description: 'Add Case Note',
    swaggerMethodName: 'addCaseNote',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-notes/add-case-note'),
    method: 'POST',
    path: `${routesBaseUrlPath}/case/notes`,
  },
  {
    description: 'Delete case note',
    swaggerMethodName: 'deleteCaseNote',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-notes/delete-case-note'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/case/notes/{caseNoteId}`,
  },
  {
    description: 'Edit Case Note',
    swaggerMethodName: 'updateCaseNote',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-notes/edit-case-note'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/case/note`,
  },
  {
    description: 'Read Case Notes',
    swaggerMethodName: 'getCaseNotes',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'case-notes/get-case-notes'),
    method: 'GET',
    path: `${routesBaseUrlPath}/case/{caseId}/notes`,
  },
] as Array<ConfigRouteEntry>;

export default caseNotesRouteConfigs;
