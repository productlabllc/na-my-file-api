import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { UpdateCaseRequestBodySchema, UpdateCaseResponseSchema } from '../../lib/route-schemas/case.schema';
import { UpdateCaseRequestBody } from '../../lib/route-interfaces';
import { getDB } from '../../lib/db';
import * as Joi from 'joi';

export const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: UpdateCaseRequestBodySchema,
  responseBody: UpdateCaseResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: UpdateCaseRequestBody = input.body;
  const { caseId } = input.params;

  const updateValues = { ...requestBody };
  const updateKeys = Object.keys(updateValues) as Array<keyof typeof updateValues>;
  updateKeys.forEach(key => {
    if (updateValues[key] === undefined || updateValues[key] === null) {
      delete updateValues[key];
    }
  });

  await db.case.update({
    where: {
      id: caseId,
    },
    data: {
      ...updateValues,
    },
  });

  const overallCase = await db.case.findFirst({
    where: {
      id: caseId,
      DeletedAt: null,
    },
    include: {
      CaseApplicants: true,
      CaseTeamAssignments: true,
    },
  });

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
