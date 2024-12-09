import Joi = require('joi');

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
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { DeleteCaseFileRequestSchema } from '../../lib/route-schemas/case-file.schema';
import { DeleteCaseFileRequest } from '../../lib/route-interfaces';
import { CAN_ADD_CASE_FILE, CASE_OWNER } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: DeleteCaseFileRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const existingCase = await db.case.findFirst({
    where: {
      id: caseId,
    },
    select: {
      CaseTeamAssignments: {
        where: {
          CaseRole: CASE_OWNER,
        },
      },
    },
  });

  // make sure this use can remove these files
  if (!(await user.isUserInGroup(CAN_ADD_CASE_FILE)) && existingCase?.CaseTeamAssignments[0]?.UserId !== user.id) {
    throw new CustomError('User does not have permission to add files to case', 403);
  }

  const requestBody: DeleteCaseFileRequest = input.body;

  const data = await db.caseFile.softDeleteMany({
    where: {
      AND: {
        CaseId: caseId,
        UserFileId: {
          in: requestBody.UserFileIds.map(ele => ele),
        },
      },
    },
  });

  await logActivity({
    activityType: 'REMOVE_CASE_FILES',
    activityValue: `User (${user.Email} - ${user.IdpId}) removed case files (${requestBody.UserFileIds}) for case ${caseId}`,
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE',
  });

  return data;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
