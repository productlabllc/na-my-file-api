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
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { DeleteCaseFileRequestSchema } from '../../lib/route-schemas/case-file.schema';
import { DeleteCaseFileRequest } from '../../lib/route-interfaces';
import { CLIENT } from '../../lib/constants';
import { triggerCaseCriterionCalculation } from '../../lib/sqs';
import logRemoveCaseFiles from '../../lib/data/log-remove-case-files';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: DeleteCaseFileRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const requestBody: DeleteCaseFileRequest = input.body;

  const existingCase = await db.case.findFirst({
    where: {
      id: caseId,
      CaseTeamAssignments: {
        some: {
          UserId: user.id,
          CaseRole: CLIENT,
        },
      },
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
      CaseFiles: {
        include: {
          Case: {
            include: {
              CaseTeamAssignments: {
                where: {
                  CaseRole: CLIENT,
                  DeletedAt: null,
                },
                include: {
                  User: {
                    where: {
                      DeletedAt: null,
                    },
                  },
                },
              },
            },
          },
          CaseCriterion: {
            where: {
              DeletedAt: null,
            },
          },
          GeneratedFile: {
            include: {
              UserFamilyMember: {
                where: {
                  DeletedAt: null,
                },
              },
            },
          },
        },
        where: {
          GeneratedFileId: {
            in: requestBody.GeneratedFileIds.map(ele => ele),
          },
          CaseCriterionId: requestBody.CaseCriterionId,
        },
      },
    },
  });

  if (!existingCase || !existingCase.CaseTeamAssignments.length) {
    throw new CustomError(JSON.stringify({ message: 'Failed to identify Case or member does not own this case' }), 400);
  }

  const data = await db.caseFile.softDeleteMany({
    where: {
      AND: {
        CaseId: caseId,
        GeneratedFileId: {
          in: requestBody.GeneratedFileIds.map(ele => ele),
        },
        CaseCriterionId: requestBody.CaseCriterionId,
      },
    },
  });

  await triggerCaseCriterionCalculation({
    caseId,
    caseCriterionId: requestBody.CaseCriterionId,
  });

  await logRemoveCaseFiles(existingCase.CaseFiles, user, input);

  return data;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
