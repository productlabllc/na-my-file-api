import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { GetUserWorkFlowsResponseSchema } from '../../lib/route-schemas/user.schema';

const routeSchema: RouteSchema = {
  responseBody: GetUserWorkFlowsResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

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
