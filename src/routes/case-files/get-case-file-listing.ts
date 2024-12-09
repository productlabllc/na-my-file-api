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
import { CAN_ADD_CASE_FILE_WORKFLOW_ROLES, CLIENT } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';
import { GetCaseFileListingResponseSchema } from '../../lib/route-schemas/case-file.schema';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

export const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  responseBody: GetCaseFileListingResponseSchema,
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
    include: {
      // Any user belonging to the case can view files
      CaseTeamAssignments: {
        include: {
          User: {
            include: {
              StakeholderGroupRoles: {
                include: {
                  StakeholderGroupRole: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const userOwnsCase = existingCase?.CaseTeamAssignments.some(
    member => member.UserId === user.id && member.CaseRole === CLIENT,
  );

  // const is user in caseTeamAssignments
  const userIsInCaseTeamAssignments = existingCase?.CaseTeamAssignments.some(ele => ele.UserId === user.id);

  if (!userIsInCaseTeamAssignments) {
    throw new CustomError('User does not have permission to get case files status', 403);
  }

  if (userOwnsCase || userIsInCaseTeamAssignments) {
    const overallCaseFiles = await db.caseFile.findMany({
      where: {
        CaseId: caseId,
        DeletedAt: null,
      },
      include: {
        CaseCriterion: true,
        Case: {
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
        },
        GeneratedFile: {
          include: {
            UserFamilyMember: true,
          },
        },
      },
    });

    // const is user in caseTeamAssignments
    const teamMember = existingCase?.CaseTeamAssignments.find(ele => ele.UserId === user.id);

    const isCaseOwner = existingCase?.CaseTeamAssignments.find(ele => ele.CaseRole === CLIENT)?.UserId === user.id;

    const userRoles = teamMember?.User?.StakeholderGroupRoles.map(ele => ele.StakeholderGroupRole?.Name);

    const allRoles = CAN_ADD_CASE_FILE_WORKFLOW_ROLES;

    const canViewCaseFile = userRoles?.some(role => allRoles.includes(role as any));

    if (!canViewCaseFile && !isCaseOwner) {
      throw new CustomError(JSON.stringify({ message: 'User does not have permission to get case files status' }), 403);
    }

    const returnValue = overallCaseFiles.map(caseFile => {
      return {
        id: caseFile.id,
        Status: caseFile.Status,
        GeneratedFile: caseFile.GeneratedFile,
      };
    });

    const activityData: ActivityLogMessageType = {
      activityType: 'CLIENT_VIEW_CASE_FILE_LIST',
      activityValue: JSON.stringify({ case: { ...existingCase, CaseTeamAssignments: undefined }, value: returnValue }),
      userId: user.id,
      timestamp: new Date(),
      caseFilIds: overallCaseFiles.map(cf => cf.id),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: caseId,
      activityRelatedEntity: 'CASE',
    };

    await logActivity({
      ...activityData,
      activityCategory: 'case',
    });

    return returnValue;
  } else {
    throw new CustomError(JSON.stringify({ message: 'User does not have permission to get case files status' }), 403);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
