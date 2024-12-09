import * as Joi from 'joi';

import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';

import { getDB } from '../../lib/db';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CAN_CHANGE_CASE_FILE_STATUS } from '../../lib/constants';
import { UpdateCaseFileRequest } from '../../lib/route-interfaces';
import { UpdateCaseFileRequestSchema } from '../../lib/route-schemas/case-file.schema';
import { logActivity } from '../../lib/sqs';

export const routeSchema: RouteSchema = {
  requestBody: UpdateCaseFileRequestSchema,
  params: {
    id: Joi.string().uuid().required(),
  },
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { id } = input.params as { id: string };
  const db = getDB();

  const jwt = input.routeData.jwt;
  const user = await getUserByEmail(jwt?.email);

  const requestBody: UpdateCaseFileRequest = input.body;

  const canChangeCaseFileStatus = await user.isUserInGroup(CAN_CHANGE_CASE_FILE_STATUS);

  const existingCaseFile = await db.caseFile.findUnique({ where: { id } });
  if (!existingCaseFile) {
    throw new CustomError(`Attempting to perform an update on a case file that was not found; Case file id: ${id}`, 404);
  }

  if (canChangeCaseFileStatus) {
    const overallCase = await db.caseFile.update({
      where: {
        id,
      },
      data: requestBody,
      select: {
        Status: true,
        UserFile: {
          select: {
            Title: true,
            id: true,
          },
        },
      },
    });

    await logActivity({
      activityType: 'REMOVE_CASE_FILES',
      activityValue: `User (${user.Email} - ${user.IdpId}) updated case file (${id}) for case ${existingCaseFile.CaseId}`,
      userId: user.id,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: id,
      activityRelatedEntity: 'CASE_FILE',
    });

    return overallCase;
  } else {
    throw new CustomError('User does not have permission to update case file', 403);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
