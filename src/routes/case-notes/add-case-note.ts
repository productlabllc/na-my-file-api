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

import { AddCaseNoteRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { logActivity } from '../../lib/sqs';
import { AddCaseNoteRequestSchema, CaseNoteSchema } from '../../lib/route-schemas/case.schema';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';
import { CLIENT } from '../../lib/constants';

const routeSchema: RouteSchema = {
  requestBody: AddCaseNoteRequestSchema,
  responseBody: CaseNoteSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const requestBody = input.body as AddCaseNoteRequest;

  const canAddNotes = await db.caseTeamAssignment.findMany({
    where: {
      CaseId: requestBody.CaseId,
      UserId: userId,
    },
  });

  if (!canAddNotes.length) {
    throw new CustomError(JSON.stringify({ message: 'This user does not have permission to add case notes' }), 400);
  }

  // Add Case Note
  const caseNote = await db.caseNote.create({
    data: {
      ...requestBody,
      AuthorUserId: userId,
    },
    include: {
      CaseNote: {
        include: {
          AuthorUser: true,
        },
      },
      AuthorUser: true,
    },
  });

  const thisCase = await db.case.findFirst({
    where: {
      id: requestBody.CaseId,
    },
    include: {
      CaseTeamAssignments: {
        where: {
          CaseRole: CLIENT,
        },
        include: {
          User: true,
        },
      },
    },
  });

  const activityData: ActivityLogMessageType = {
    activityType: requestBody.ParentNodeId ? 'AGENT_REPLY_TO_CASE_NOTE' : 'AGENT_ADD_NEW_CASE_NOTE',
    activityValue: JSON.stringify({ newValue: caseNote, case: thisCase }),
    userId: userId!,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: thisCase?.id,
    activityRelatedEntity: 'CASE',
  };

  await logActivity({
    ...activityData,
    activityCategory: 'case',
  });

  return caseNote;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
