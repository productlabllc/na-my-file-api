import {
  MiddlewareArgumentsInputFunction,
  RouteModule,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { ActivityLogTypesList } from '../../lib/types-and-interfaces';
import { ConstantsSchema } from '../../lib/route-schemas/constants.schema';
import {
  AGENCY_TYPE,
  CASE_CRITERION_FULFILLMENT_STATUS,
  CASE_FILE_STATUS,
  CRITERION_FULFILLMENT_TYPE,
  STAKEHOLDER_GROUP_ROLES,
  STAKEHOLDER_GROUPS,
  USER_FILE_STATUS,
} from '../../lib/constants';
import permissions from '../../lib/permissions';

const routeSchema: RouteSchema = {
  params: {},
  query: {},
  requestBody: {},
  responseBody: ConstantsSchema,
};

const handler: MiddlewareArgumentsInputFunction = input => {
  return {
    AgencyType: AGENCY_TYPE,
    CaseFileStatus: CASE_FILE_STATUS,
    CaseCriterionFulfillmentStatus: CASE_CRITERION_FULFILLMENT_STATUS,
    CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE,
    UserFileStatus: USER_FILE_STATUS,
    StakeHolderGroups: STAKEHOLDER_GROUPS,
    StakeHolderGroupRoles: STAKEHOLDER_GROUP_ROLES,
    Permissions: permissions,
    ActivityLogs: ActivityLogTypesList,
  };
};

const routeModule: RouteModule = {
  routeChain: [schemaValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema: routeSchema,
};

export default routeModule;
