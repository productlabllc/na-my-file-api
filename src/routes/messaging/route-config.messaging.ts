import { join } from 'path';
import { routesBaseUrlPath, routesSourceBaseDirectory } from '../../lib/utils';
import { ConfigRouteEntry } from '@myfile/core-sdk';

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
