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
import { CAN_VIEW_CASE_FILE_STATUS, CASE_OWNER } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';

export const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
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
      CaseTeamAssignments: {
        where: {
          CaseRole: CASE_OWNER,
        },
      },
    },
  });

  const canViewCaseFileStatus = await user.isUserInGroup(CAN_VIEW_CASE_FILE_STATUS);

  const userOwnsCase = existingCase?.CaseTeamAssignments[0]?.UserId === user.id;

  if (userOwnsCase || canViewCaseFileStatus) {
    const overallCase = await db.caseFile.findMany({
      where: {
        CaseId: caseId,
        DeletedAt: null,
      },
      include: {
        UserFile: {
          select: {
            id: true,
            Title: true,
          },
        },
      },
    });

    // const is user in caseTeamAssignments
    const isUserInCaseTeamAssignments = existingCase?.CaseTeamAssignments.some(ele => ele.UserId === user.id);

    if(!isUserInCaseTeamAssignments) {
      throw new CustomError('User does not have permission to get case files status', 403);
    }

    await logActivity({
      activityType: 'GET_CASE_FILE_LISTING',
      activityValue: `User (${user.Email} - ${user.IdpId}) retrieved case file listing for case ${caseId}`,
      userId: user.id,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: caseId,
      activityRelatedEntity: 'CASE',
    });

    return overallCase.map(caseFile => {
      return {
        id: caseFile.id,
        Status: caseFile.Status,
        UserFile: caseFile.UserFile,
      };
    });
  } else {
    throw new CustomError('User does not have permission to get case files status', 403);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
