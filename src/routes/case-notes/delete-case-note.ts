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
import { logActivity } from '../../lib/sqs';
import { CaseNoteSchema } from '../../lib/route-schemas/case.schema';
import joi = require('joi');
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';
import { CLIENT } from '../../lib/constants';

const routeSchema: RouteSchema = {
  params: {
    caseNoteId: joi.string().required(),
  },
  responseBody: CaseNoteSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const { caseNoteId } = input.params as { caseNoteId: string };

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const caseNote = await db.caseNote.findFirst({
    where: {
      id: caseNoteId,
    },
  });

  const canRemoveCaseNote =
    caseNote &&
    (await db.caseTeamAssignment.findMany({
      where: {
        CaseId: caseNote?.CaseId,
        UserId: userId,
      },
    }));

  if (!canRemoveCaseNote?.length) {
    throw new CustomError(JSON.stringify({ message: 'This user does not have permission to update case notes' }), 400);
  }

  // Add Case Note
  await db.caseNote.softDelete({
    where: {
      id: caseNoteId,
      AuthorUserId: userId,
    },
  });

  const thisCase = await db.case.findFirst({
    where: {
      id: caseNote?.CaseId!,
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
    activityType: 'AGENT_REMOVE_CASE_NOTE',
    activityValue: JSON.stringify({ case: thisCase, oldValue: caseNote }),
    userId: userId!,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseNote?.id,
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
