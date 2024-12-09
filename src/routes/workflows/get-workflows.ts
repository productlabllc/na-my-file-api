import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getDB } from '../../lib/db';
import joi = require('joi');
import { WorkFlowSchema } from '../../lib/route-schemas/workflow.schema';

export const routeSchema: RouteSchema = {
  responseBody: joi.array().items(WorkFlowSchema),
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();
    return await db.workflow.findMany({
      where: {
        DeletedAt: null,
      },
      select: {
        id: true,
        Name: true,
        Description: true,
        Type: true,
        CreatedAt: true,
        WorkflowStage: true,
      },
    });
  } catch (error: any) {
    console.log(error);
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
