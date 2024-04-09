import { ConfigRouteEntry } from '@myfile/core-sdk';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const caseFilesRoutes = [
  {
    description: 'Proxy the token request call as NYCID does not support CORS',
    swaggerMethodName: 'nycIdProxyToken',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'nycid/token'),
    method: 'POST',
    path: `${routesBaseUrlPath}/nycid/token`,
  },
  {
    description: 'Proxy the user info request call as NYCID does not support CORS',
    swaggerMethodName: 'nycIdProxyUserInfo',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'nycid/userinfo'),
    method: 'GET',
    path: `${routesBaseUrlPath}/nycid/userinfo`,
  },
] as Array<ConfigRouteEntry>;

export default caseFilesRoutes;
