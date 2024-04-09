import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { AddWorkFlowRequest } from '../../lib/route-interfaces';
import { AddUserWorkFlowRequestSchema, AddUserWorkFlowResponseSchema } from '../../lib/route-schemas/user.schema';

const routeSchema: RouteSchema = {
  requestBody: AddUserWorkFlowRequestSchema,
  responseBody: AddUserWorkFlowResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: AddWorkFlowRequest = input.body;

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user.id;

  const wf = await db.workflow.findFirst({
    where: {
      id: requestBody.WorkflowId,
    },
  });

  if (!wf) {
    throw new CustomError('Workflow does not exists', 400);
  }

  // make sure user does not have this workflow

  const userWorkflow = await db.userWorkflow.findFirst({
    where: {
      AND: {
        UserId: userId,
        WorkflowId: requestBody.WorkflowId,
        DeletedAt: null,
      },
    },
  });

  if (userWorkflow) {
    throw new CustomError('User already has this workflow', 400);
  }

  const workflow = await db.userWorkflow.create({
    data: {
      WorkflowId: requestBody.WorkflowId,
      UserId: userId,
    },
    select: {
      id: true,
      User: true,
      CreatedAt: true,
      LastModifiedAt: true,
    },
  });

  return workflow;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
