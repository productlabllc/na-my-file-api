import {
  CustomError,
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
import { AddWorkFlowRequest } from '../../lib/route-interfaces';
import { DeleteUserWorkFlowRequestSchema, DeleteUserWorkFlowResponseSchema } from '../../lib/route-schemas/user.schema';

const routeSchema: RouteSchema = {
  requestBody: DeleteUserWorkFlowRequestSchema,
  responseBody: DeleteUserWorkFlowResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: AddWorkFlowRequest = input.body;

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user.id;

  const workflow = await db.userWorkflow.softDeleteMany({
    where: {
      AND: {
        WorkflowId: requestBody.WorkflowId,
        UserId: userId,
      },
    },
  });

  return workflow;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
