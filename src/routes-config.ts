import { join } from 'path';
import { RouteConfig } from 'aws-lambda-api-tools';
import { routesBaseUrlPath, routesSourceBaseDirectory } from './lib/utils';

import userRoutes from './routes/users/route-config.users';
import messagingRoutes from './routes/messaging/route-config.messaging';
import caseRoutes from './routes/cases/route-config.cases';
import userFamilyRoutes from './routes/user-family/route-config.family-member';
import caseApplicantsRoutes from './routes/case-family-members/route-config.case-family-members';
import workflowRoutes from './routes/workflows/route-config.workflow';
import userFileRoutes from './routes/user-files/route-config.user-files';
import caseFileRoutes from './routes/case-files/route-config.case-files';
import languageRoutes from './routes/languages/route-config.language';
import lookupRoutes from './routes/lookups/route-config.lookups';
import constantsRoutes from './routes/constants/route-config';
import caseNoteRoutes from './routes/case-notes/route-config.case-notes';
import caseCriterionRouteConfig from './routes/case-criteria/route-config.case-criteria';
import activityRoutes from './routes/activities/route-config.activities';

export { routesBaseUrlPath } from './lib/utils';

export const config: RouteConfig = {
  routes: [
    // Language Routes
    ...languageRoutes,

    // Lookup Routes
    ...lookupRoutes,

    // Case Files routes
    ...caseFileRoutes,

    // User File Routes
    ...userFileRoutes,

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

    /** constants */
    ...constantsRoutes,

    /** case notes */
    ...caseNoteRoutes,

    /** case criterion */
    ...caseCriterionRouteConfig,

    /** Activities */
    ...activityRoutes,

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
