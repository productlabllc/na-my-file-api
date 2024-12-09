import { ConfigRouteEntry } from 'aws-lambda-api-tools';
import { routesSourceBaseDirectory, routesBaseUrlPath } from '../../lib/utils';
import { join } from 'path';

const constantsRoutes = [
  {
    description: 'List all constants in my file api',
    swaggerMethodName: 'getConstants',
    generateOpenApiDocs: true,
    handlerPath: join(routesSourceBaseDirectory, 'constants/get-constants'),
    method: 'GET',
    path: `${routesBaseUrlPath}/constants`,
  },
] as Array<ConfigRouteEntry>;

export default constantsRoutes;
