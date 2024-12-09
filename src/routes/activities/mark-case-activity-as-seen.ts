import joi = require('joi');

import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { GetUserActivityResponse, MarkCaseActivityAsRead } from '../../lib/route-interfaces';
import { getDB } from '../../lib/db';
import { Prisma } from '.prisma/client';
import { STAKEHOLDER_GROUP_ROLES as stk } from '../../lib/constants';
import { CaseActivityLogsSchema, MarkCaseActivityAsReadSchema } from '../../lib/route-schemas/platform-activity.schema';

export const routeSchema: RouteSchema = {
  requestBody: MarkCaseActivityAsReadSchema,
  responseBody: CaseActivityLogsSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const jwt: CognitoJwtType = input.routeData.jwt;

  const db = getDB();

  const user = await getUserByEmail(jwt?.email);

  const requestBody = input.body as MarkCaseActivityAsRead;

  /**
   * Can user read users
   */

  const userGroups = await db.user_StakeholderGroupRole.findMany({
    where: {
      UserId: user.id,
    },
    include: {
      StakeholderGroupRole: true,
    },
  });

  const admittedGroups = [
    stk.DHS_ADMIN,
    stk.DHS_AGENT,
    stk.HPD_ADMIN,
    stk.HPD_AGENT,
    stk.PATH_AGENT,
    stk.PATH_ADMIN,
    stk.PLATFORM_ADMIN,
    stk.CBO_STAFFER,
    stk.CBO_SUPERVISOR,
  ];

  const canViewUser = userGroups.some(ele => admittedGroups.includes(ele.StakeholderGroupRole?.Name ?? ('' as any)));

  if (!canViewUser) {
    throw new CustomError(JSON.stringify({ message: 'User does not have permission to update activity' }), 400);
  }

  const activityLog = await db.caseActivityLog.update({
    where: {
      id: requestBody.caseActivityLogId,
      Case: {
        id: requestBody.caseId,
        // making this user's role can update this case.
        CaseTeamAssignments: {
          some: {
            UserId: user.id,
            CaseRole: {
              in: admittedGroups,
            },
          },
        },
      },
    },
    data: {
      ActivityAcknowledged: requestBody.readStatus,
    },
  });

  return activityLog;
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
