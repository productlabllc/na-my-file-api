import * as Joi from 'joi';

import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';

import { getDB } from '../../lib/db';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { CASE_OWNER } from '../../lib/constants';
import { DeleteCaseFileRequestSchema } from '../../lib/route-schemas/case-file.schema';
import { DeleteCaseFileRequest } from '../../lib/route-interfaces';

export const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: DeleteCaseFileRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user?.id;

  const requestBody: DeleteCaseFileRequest = input.body;

  const data = await db.caseFile.softDeleteMany({
    where: {
      AND: {
        CaseId: caseId,
        Case: {
          CaseTeamAssignments: {
            every: {
              UserId: userId,
              CaseRole: CASE_OWNER,
            },
          },
        },
        UserFileId: {
          in: requestBody.UserFileIds.map(ele => ele),
        },
      },
    },
  });

  return data;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
