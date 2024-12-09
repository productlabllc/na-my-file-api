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
import { GetCaseUserFileResponseSchema } from '../../lib/route-schemas/case.schema';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CAN_GET_CASE, CAN_GET_CASE_WHEN_IN_CASE, CASE_OWNER } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  responseBody: GetCaseUserFileResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt = input.routeData.jwt;
  const user = await getUserByEmail(jwt?.email);

  // check of user can get user case === is member is team member for the case?

  const existingCase = await db.case.findFirst({
    where: {
      AND: {
        id: caseId,
        DeletedAt: null,
      },
    },
    select: {
      CaseTeamAssignments: true,
    },
  });

  const isCaseAdmin = await user.isUserInGroup(CAN_GET_CASE);

  const userOwnsCase = existingCase?.CaseTeamAssignments.find(ele => ele.CaseRole === CASE_OWNER)?.UserId === user.id;

  const userIsTeamMember = existingCase?.CaseTeamAssignments.some(ele => ele.UserId === user.id);

  const isUsersExtendedAdmin = await user.isUserInGroup(CAN_GET_CASE_WHEN_IN_CASE);

  if (userOwnsCase || isCaseAdmin || (userIsTeamMember && isUsersExtendedAdmin)) {
    const overallCase = await db.caseFile.findMany({
      where: {
        CaseId: caseId,
        DeletedAt: null,
        Case: {
          CaseTeamAssignments: {
            some: {
              UserId: user.id,
            },
          },
        },
      },
      include: {
        UserFile: true,
      },
    });

    await logActivity({
      activityType: 'GET_CASE_FILE_LISTING',
      activityValue: `User (${user.Email} - ${user.IdpId}) retrieved case file listing for case ${caseId}`,
      userId: user.id,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: caseId,
      activityRelatedEntity: 'CASE',
    });

    return overallCase.map(caseFile => caseFile.UserFile);
  } else {
    throw new CustomError('User does not have permission to get case files', 403);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
