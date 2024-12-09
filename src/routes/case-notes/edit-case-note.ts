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
import { CaseNoteSchema, UpdateCaseNoteRequestSchema } from '../../lib/route-schemas/case.schema';
import { UpdateCaseNoteRequest } from '../../lib/route-interfaces/case.schema';
import { CLIENT } from '../../lib/constants';

const routeSchema: RouteSchema = {
  requestBody: UpdateCaseNoteRequestSchema,
  responseBody: CaseNoteSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const requestBody = input.body as UpdateCaseNoteRequest;

  const caseNote = await db.caseNote.findFirst({
    where: {
      id: requestBody.id,
    },
  });

  const canAddNotes =
    caseNote &&
    (await db.caseTeamAssignment.findMany({
      where: {
        CaseId: caseNote?.CaseId,
        UserId: userId,
      },
    }));

  if (!canAddNotes?.length) {
    throw new CustomError(JSON.stringify({ message: 'This user does not have permission to update case notes' }), 400);
  }

  // Add Case Note
  const newCaseNote = await db.caseNote.update({
    where: {
      id: requestBody.id,
      AuthorUserId: userId,
    },
    data: {
      NoteText: requestBody.NoteText,
      LastModifiedAt: new Date(),
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

  await logActivity({
    activityType: 'AGENT_EDIT_CASE_NOTE',
    activityValue: JSON.stringify({ newValue: newCaseNote, case: thisCase, oldValue: caseNote }),
    userId: userId!,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: newCaseNote.id,
    activityRelatedEntity: 'CASE_NOTE',
  });

  return caseNote;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
