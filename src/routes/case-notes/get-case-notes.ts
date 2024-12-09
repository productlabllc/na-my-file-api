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
import { GetCaseNotesResponseSchema } from '../../lib/route-schemas/case.schema';
import Joi = require('joi');
import { CLIENT } from '../../lib/constants';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().required(),
  },
  query: {
    limit: Joi.number().default(20),
    skip: Joi.number().default(0),
  },
  responseBody: GetCaseNotesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };

  const { limit, skip } = input.query as { limit: number; skip: number };

  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const canAddNotes = await db.caseTeamAssignment.findMany({
    where: {
      CaseId: caseId,
      UserId: userId,
      DeletedAt: null,
    },
  });

  if (!canAddNotes?.length) {
    throw new CustomError(JSON.stringify({ message: 'This user does not have permission to update case notes' }), 400);
  }

  const caseNotes = await db.caseNote.findMany({
    skip,
    take: limit,
    where: {
      CaseId: caseId,
    },
  });

  const thisCase = await db.case.findFirst({
    where: {
      id: caseId,
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
    activityType: 'AGENT_VIEW_CASE_NOTES',
    activityValue: JSON.stringify({ value: caseNotes, case: thisCase }),
    userId: userId!,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE_NOTE',
  });

  return caseNotes;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
