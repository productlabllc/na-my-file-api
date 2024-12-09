import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { UpdateCaseRequestBodySchema, UpdateCaseResponseSchema } from '../../lib/route-schemas/case.schema';
import { UpdateCaseRequestBody } from '../../lib/route-interfaces';
import { getDB } from '../../lib/db';
import Joi = require('joi');
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { logActivity } from '../../lib/sqs';
import { CAN_CHANGE_CASE_FILE_STATUS } from '../../lib/permissions';
import { CLIENT } from '../../lib/constants';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: UpdateCaseRequestBodySchema,
  responseBody: UpdateCaseResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: UpdateCaseRequestBody = input.body;
  const { caseId } = input.params;

  const user = await getUserByEmail(input.routeData.jwt?.email);

  const updateValues = { ...requestBody };

  const updateKeys = Object.keys(updateValues) as Array<keyof typeof updateValues>;
  updateKeys.forEach(key => {
    if (updateValues[key] === undefined || updateValues[key] === null) {
      delete updateValues[key];
    }
  });

  const teamMember = await db.caseTeamAssignment.findFirst({
    where: {
      CaseId: caseId,
      UserId: user.id,
      DeletedAt: null,
    },
    include: {
      User: {
        where: {
          DeletedAt: null,
        },
        include: {
          StakeholderGroupRoles: {
            where: {
              DeletedAt: null,
            },
            include: {
              StakeholderGroupRole: true,
            },
          },
        },
      },
    },
  });

  const hasCaseStatus = !!updateValues.Status;

  if (hasCaseStatus) {
    const userRoles = teamMember?.User?.StakeholderGroupRoles.map(role => role.StakeholderGroupRole?.Name);
    const canUpdateCaseStatus = userRoles?.some(role => CAN_CHANGE_CASE_FILE_STATUS.includes(role as any));

    if (!canUpdateCaseStatus) {
      throw new CustomError(JSON.stringify({ message: 'User does not have permission to update this case' }), 403);
    }
  } else {
    const userHasCase = teamMember?.CaseRole === CLIENT;

    if (!userHasCase) {
      throw new CustomError(JSON.stringify({ message: 'User does not have permission to update this case' }), 403);
    }
  }

  const existingCase = await db.case.findFirst({ where: { id: caseId } });

  const overallCase = await db.case.update({
    where: {
      id: caseId,
      DeletedAt: null,
    },
    data: {
      ...updateValues,
    },
    include: {
      CaseApplicants: true,
      CaseTeamAssignments: true,
    },
  });

  const activityData: ActivityLogMessageType = {
    activityType:
      hasCaseStatus && requestBody.Status === 'CLOSED'
        ? 'AGENT_CLOSE_CASE'
        : requestBody.Status === 'OPEN'
          ? 'AGENT_ACTIVATE_CASE'
          : 'CLIENT_UPDATE_CASE',
    activityValue: JSON.stringify({
      oldValue: existingCase,
      case: overallCase,
      newValue: { ...overallCase, CaseApplicants: undefined, CaseTeamAssignments: undefined },
    }),
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input, updatedCase: overallCase }),
    activityRelatedEntityId: caseId,
    activityRelatedEntity: 'CASE',
  };

  await logActivity({ ...activityData, activityCategory: 'case' });

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
