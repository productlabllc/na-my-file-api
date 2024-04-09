import {
  CustomError,
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
import Joi = require('joi');
import { CAN_CHANGE_APPLICATION_STATUS, CASE_OWNER } from '../../lib/constants';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
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

  const user = await getUserByEmail(input.routeData.jwt?.email);

  const canChangeApplicationStatus = await user.isUserInGroup(CAN_CHANGE_APPLICATION_STATUS);

  const updateValues = { ...requestBody };
  const updateKeys = Object.keys(updateValues) as Array<keyof typeof updateValues>;
  updateKeys.forEach(key => {
    if (updateValues[key] === undefined || updateValues[key] === null) {
      delete updateValues[key];
    }
  });

  const userHasCase = await db.caseTeamAssignment.findFirst({
    where: {
      CaseId: caseId,
      CaseRole: CASE_OWNER,
      UserId: user.id,
    },
  });

  if (updateValues.Status && !canChangeApplicationStatus) {
    throw new CustomError('User does not have permission to change application status', 403);
  }

  if (!updateValues.Status && !userHasCase) {
    throw new CustomError('User does not have permission to update this case', 403);
  }
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

  await logActivity({
    activityType: 'UPDATE_CASE',
    activityValue: `User (${user.Email} - ${user.IdpId}) updated case details for case (${caseId}).`,
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input, updatedCase: overallCase }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE',
  });

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
