import {
  CustomError,
  jwtValidationMiddleware,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import Joi = require('joi');
import { CriteriaCaseFilesResponse } from '../../lib/route-schemas/case.schema';
import { getDB } from '../../lib/db';
import { RouteModule } from 'aws-lambda-api-tools/dist/lib/types-and-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CLIENT, IS_ADMIN } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  params: {
    caseCriterionId: Joi.string().uuid(),
  },
  responseBody: CriteriaCaseFilesResponse,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseCriterionId } = input.params as { caseCriterionId: string };

  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const caseCriterion = await db.caseCriterion.findUnique({
    where: {
      id: caseCriterionId,
    },
    include: {
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
    },
  });

  const userRoles = user.StakeholderGroupRoles.map(ele => ele.StakeholderGroupRole?.Name);

  const canUserDelete = userRoles.some(role => IS_ADMIN.includes(role as any));

  if (!canUserDelete) {
    throw new CustomError(JSON.stringify({ message: 'User cannot delete criterion' }), 403);
  }

  const deletedCriterion = await db.caseCriterion.softDelete({
    where: {
      id: caseCriterionId,
    },
  });

  const activityData: ActivityLogMessageType = {
    activityType: 'AGENT_REMOVE_CASE_WORKFLOW_CRITERIA',
    activityValue: JSON.stringify({ oldValue: caseCriterion, case: caseCriterion?.Case }),
    userId: user.id!,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseCriterionId,
    activityRelatedEntity: 'CASE_CRITERION',
  };

  await logActivity({ ...activityData, activityCategory: 'case' });

  return deletedCriterion;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
