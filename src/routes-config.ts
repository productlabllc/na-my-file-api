import { join } from 'path';
import { RouteConfig } from '@myfile/core-sdk';
import { routesBaseUrlPath, routesSourceBaseDirectory } from './lib/utils';

import userRoutes from './routes/users/route-config.users';
import messagingRoutes from './routes/messaging/route-config.messaging';
import caseRoutes from './routes/cases/route-config.cases';
import userFamilyRoutes from './routes/user-family/route-config.family-member';
import caseApplicantsRoutes from './routes/case-applicants/route-config.case-applicants';
import workflowRoutes from './routes/workflows/route-config.workflow';
import userWorkflowRoutes from './routes/user-workflows/route-config.user-flows';
import userFileRoutes from './routes/user-files/route-config.user-files';
import caseFileRoutes from './routes/case-files/route-config.case-files';
import languageRoutes from './routes/languages/route-config.language';

export { routesBaseUrlPath } from './lib/utils';

export const config: RouteConfig = {
  routes: [
    // Language Routes
    ...languageRoutes,

    // Case Files routes
    ...caseFileRoutes,

    // User File Routes
    ...userFileRoutes,

    // User Workflow Routes
    ...userWorkflowRoutes,

    // Workflow Routes
    ...workflowRoutes,

    // UserFamilyMember
    ...userFamilyRoutes,

    // Case Applicants Routes
    ...caseApplicantsRoutes,

    // Case Routes
    ...caseRoutes,

    // User Routes
    ...userRoutes,

    /* Websocket Messaging */
    ...messagingRoutes,

    // 404 - Default Route
    {
      description: 'Handler for not found route paths',
      path: `${routesBaseUrlPath}/{notfound+}`,
      method: 'ANY',
      handlerPath: join(routesSourceBaseDirectory, 'not-found'),
      generateOpenApiDocs: false,
    },
  ],
};
