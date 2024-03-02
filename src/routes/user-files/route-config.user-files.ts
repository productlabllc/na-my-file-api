import { ConfigRouteEntry } from '@myfile/core-sdk';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { join } from 'path';

export default [
  {
    description: 'Get user files.',
    swaggerMethodName: 'getUserFiles',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/get-user-files'),
    method: 'GET',
    path: `${routesBaseUrlPath}/users/files`,
  },
  {
    description: 'Create user file.',
    swaggerMethodName: 'createUserFile',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/create-user-file'),
    method: 'POST',
    path: `${routesBaseUrlPath}/users/files`,
  },
  {
    description: 'Update user file.',
    swaggerMethodName: 'updateUserFile',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/update-user-file'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/users/files`,
  },
  {
    description: 'Delete user file.',
    swaggerMethodName: 'deleteUserFile',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/delete-user-file'),
    method: 'DELETE',
    path: `${routesBaseUrlPath}/users/files`,
  },
  {
    description: 'Get user family member files.',
    swaggerMethodName: 'getUserFamilyMemberFiles',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/get-user-family-member-files'),
    method: 'GET',
    path: `${routesBaseUrlPath}/users/files/family-member`,
  },
  {
    description: 'Get download url for user file.',
    swaggerMethodName: 'getUserFileDownloadUrl',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/get-user-file-download-url'),
    method: 'GET',
    path: `${routesBaseUrlPath}/users/files/download`,
  },
  {
    description: 'Get cases for user file.',
    swaggerMethodName: 'getUserFileCases',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/get-user-file-cases'),
    method: 'GET',
    path: `${routesBaseUrlPath}/users/files/{fileId}/cases`,
  },
  {
    description: 'Update generated file',
    swaggerMethodName: 'updateGeneratedFile',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/update-generated-file'),
    method: 'PATCH',
    path: `${routesBaseUrlPath}/users/files/generated`,
  },
  {
    description: 'Get generated file download url',
    swaggerMethodName: 'getGeneratedFileDownloadUrl',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'user-files/get-generated-file-download-url'),
    method: 'GET',
    path: `${routesBaseUrlPath}/users/files/generated/download`,
  },
] as Array<ConfigRouteEntry>;
