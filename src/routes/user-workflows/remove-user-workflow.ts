import {
  CustomError,
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
import { AddWorkFlowRequest } from '../../lib/route-interfaces';
import { DeleteUserWorkFlowRequestSchema, DeleteUserWorkFlowResponseSchema } from '../../lib/route-schemas/user.schema';

export const routeSchema: RouteSchema = {
  requestBody: DeleteUserWorkFlowRequestSchema,
  responseBody: DeleteUserWorkFlowResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: AddWorkFlowRequest = input.body;

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

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
