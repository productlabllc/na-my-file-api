import * as Joi from 'joi';

import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';

import { getDB } from '../../lib/db';

import { AddCaseFileRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { CASE_OWNER } from '../../lib/constants';
import { AddCaseFileRequestSchema } from '../../lib/route-schemas/case-file.schema';

export const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: AddCaseFileRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user?.id;

  const requestBody: AddCaseFileRequest = input.body;

  // make sure case exists and user is owner
  const thisCase = await db.case.findFirst({
    where: {
      AND: {
        id: caseId,
        DeletedAt: null,
        CaseTeamAssignments: {
          every: {
            UserId: userId,
            CaseRole: CASE_OWNER,
          },
        },
      },
    },
    select: {
      CaseFiles: {
        where: {
          UserFileId: {
            in: requestBody.UserFileIds.map(ele => ele),
          },
          DeletedAt: null,
        },
        select: {
          UserFile: true,
        },
      },
    },
  });

  if (thisCase) {
    const caseFiles = requestBody.UserFileIds.map(ele => ({
      UserFileId: ele,
      CaseId: caseId,
    }));

    if (thisCase.CaseFiles.length) {
      throw new CustomError(
        `Case files already exists: 
        ${thisCase.CaseFiles.map(ele => ele.UserFile?.id).join(', ')}`,
        409,
      );
    }

    // make sure user has these files
    const userFiles = await db.userFile.findMany({
      where: {
        OwnerUserId: userId,
        id: {
          in: requestBody.UserFileIds,
        },
        DeletedAt: null,
      },
    });

    if (userFiles.length !== requestBody.UserFileIds.length) {
      throw new CustomError('User does not have these files', 400);
    }

    const data = await db.caseFile.createMany({
      data: caseFiles,
    });

    return data;
  } else {
    throw new CustomError('Case Not Found', 400);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
