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
import { UpdateCaseFileRequest } from '../../lib/route-interfaces';
import { UpdateCaseFileRequestSchema } from '../../lib/route-schemas/case-file.schema';
import { logActivity } from '../../lib/sqs';
import { CAN_ADD_CASE_FILE_WORKFLOW_ROLES, CLIENT, STAKEHOLDER_GROUP_ROLES } from '../../lib/constants';
import { ActivityLogMessageType, ActivityLogType } from '../../lib/types-and-interfaces';

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

  const existingCaseFile = await db.caseFile.findUnique({
    where: { id },
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
  if (!existingCaseFile) {
    throw new CustomError(
      JSON.stringify({
        message: `Attempting to perform an update on a case file that was not found; Case file id: ${id}`,
      }),
      404,
    );
  }

  const updatedCaseFile = await db.caseFile.update({
    where: {
      id,
      Case: {
        CaseTeamAssignments: {
          some: {
            UserId: user.id,
            CaseRole: {
              in: CAN_ADD_CASE_FILE_WORKFLOW_ROLES,
            },
          },
        },
      },
    },
    data: requestBody,
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

  const isAgent = user.StakeholderGroupRoles.some(
    sgr => sgr.StakeholderGroupRole?.Name !== STAKEHOLDER_GROUP_ROLES.CLIENT,
  );
  const isFamilyMemberDoc = updatedCaseFile.GeneratedFile?.FamilyMemberId;

  let activityType: ActivityLogType = isFamilyMemberDoc
    ? 'CLIENT_UPDATE_CASE_FILE_FAMILY_MEMBER'
    : 'CLIENT_UPDATE_CASE_FILE_SELF';
  if (isAgent) {
    switch (requestBody.Status) {
      case 'ACCEPTED':
        activityType = isFamilyMemberDoc ? 'AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER' : 'AGENT_APPROVE_CASE_FILE_CLIENT';
        break;
      case 'PENDING':
        activityType = isFamilyMemberDoc ? 'AGENT_PENDING_CASE_FILE_FAMILY_MEMBER' : 'AGENT_PENDING_CASE_FILE_CLIENT';
        break;
      case 'REJECT':
        activityType = isFamilyMemberDoc ? 'AGENT_REJECT_CASE_FILE_FAMILY_MEMBER' : 'AGENT_REJECT_CASE_FILE_CLIENT';
        break;
      case 'UNDER_REVIEW':
        activityType = isFamilyMemberDoc
          ? 'AGENT_UNDER_REVIEW_CASE_FILE_FAMILY_MEMBER'
          : 'AGENT_UNDER_REVIEW_CASE_FILE_CLIENT';
        break;
    }
  }

  const activityLogData: ActivityLogMessageType = {
    activityType,
    activityValue: JSON.stringify({
      oldValue: existingCaseFile,
      newValue: updatedCaseFile,
      case: updatedCaseFile.Case,
    }),
    userId: user.id,
    caseFilIds: [updatedCaseFile.id],
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: id,
    activityRelatedEntity: 'CASE_FILE',
  };

  await logActivity({ ...activityLogData, activityCategory: 'case' });

  return updatedCaseFile;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
