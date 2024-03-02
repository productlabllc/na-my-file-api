import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { GetUserWorkFlowsResponseSchema } from '../../lib/route-schemas/user.schema';

export const routeSchema: RouteSchema = {
  responseBody: GetUserWorkFlowsResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user.id;

  const workflows = await db.userWorkflow.findMany({
    where: {
      UserId: userId,
      DeletedAt: null,
    },
    select: {
      id: true,
      Workflow: true,
      CreatedAt: true,
      LastModifiedAt: true,
    },
  });

  return workflows;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
