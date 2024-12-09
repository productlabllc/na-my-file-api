import Joi = require('joi');

import {
  jwtValidationMiddleware,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { CriteriaCaseFilesResponse } from '../../lib/route-schemas/case.schema';
import { getDB } from '../../lib/db';
import { RouteModule } from 'aws-lambda-api-tools/dist/lib/types-and-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CAN_ADD_CASE_FILE_WORKFLOW_ROLES, CLIENT, USER_FILE_STATUS } from '../../lib/constants';
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

  const thisCase = await await db.case.findFirst({
    where: {
      CaseCriteria: {
        some: {
          id: caseCriterionId,
        },
      },
    },
  });

  const caseFiles = await db.caseFile.findMany({
    where: {
      DeletedAt: null,
      CaseCriterion: {
        id: caseCriterionId,
        Case: {
          CaseTeamAssignments: {
            some: {
              UserId: user.id,
              CaseRole: {
                in: [...CAN_ADD_CASE_FILE_WORKFLOW_ROLES, CLIENT],
              },
            },
          },
        },
      },
    },
    include: {
      CaseCriterion: true,
      Case: {
        include: {
          CaseTeamAssignments: {
            where: {
              CaseRole: CLIENT,
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

  const activityData: ActivityLogMessageType = {
    activityType: 'AGENT_GET_CASE_FILE_LISTING',
    activityValue: JSON.stringify({ value: caseFiles, case: thisCase }),
    userId: user.id!,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: caseCriterionId,
    activityRelatedEntity: 'CASE_CRITERION',
  };

  await logActivity({ ...activityData, activityCategory: 'case', caseFilIds: caseFiles.map(cf => cf.id) });

  return caseFiles.map(cf => {
    return {
      ...cf,
      imagesAvailable: cf.GeneratedFile?.Status === USER_FILE_STATUS.UPLOADED,
    };
  });
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
