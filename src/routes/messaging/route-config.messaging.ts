import { join } from 'path';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { ConfigRouteEntry } from 'aws-lambda-api-tools';

export default [
  /* Socket Messaging Routes */
  {
    description: 'Post message to connections',
    path: `${routesBaseUrlPath}/messaging/post-message-to-ws-connections`,
    method: 'POST',
    handlerPath: join(routesSourceBaseDirectory, 'messaging/post-message-to-ws-connections'),
    generateOpenApiDocs: true,
  },
] as Array<ConfigRouteEntry>;
