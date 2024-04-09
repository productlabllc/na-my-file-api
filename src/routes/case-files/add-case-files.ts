import Joi = require('joi');

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
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CAN_ADD_CASE_FILE, CASE_FILE_STATUS, CASE_OWNER } from '../../lib/constants';
import { AddCaseFileRequestSchema } from '../../lib/route-schemas/case-file.schema';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: AddCaseFileRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const requestBody: AddCaseFileRequest = input.body;

  // make sure case exists.
  const existingCase = await db.case.findFirst({
    where: {
      AND: {
        id: caseId,
        DeletedAt: null,
      },
    },
    // select the user having this case as the user doing the update might not be the case owner.
    select: {
      CaseTeamAssignments: {
        where: {
          CaseId: caseId,
          CaseRole: CASE_OWNER,
        },
        select: {
          UserId: true,
        },
      },
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

  if (existingCase) {
    // make sure this use can add files to case
    const canUserMakeUpdates = await user?.isUserInGroup(CAN_ADD_CASE_FILE);

    if (!canUserMakeUpdates && existingCase.CaseTeamAssignments[0]?.UserId !== user?.id) {
      throw new CustomError('User does not have permission to add files to case', 403);
    }

    const caseFiles = requestBody.UserFileIds.map(ele => ({
      UserFileId: ele,
      Status: CASE_FILE_STATUS.PENDING,
      CaseId: caseId,
    }));

    if (existingCase.CaseFiles.length) {
      throw new CustomError(
        `Case files already exists: 
        ${existingCase.CaseFiles.map(ele => ele.UserFile?.id).join(', ')}`,
        409,
      );
    }

    // make sure user has these files
    const userFiles = await db.userFile.findMany({
      where: {
        OwnerUserId: existingCase.CaseTeamAssignments[0].UserId,
        id: {
          in: requestBody.UserFileIds,
        },
        DeletedAt: null,
      },
    });

    if (userFiles.length !== requestBody.UserFileIds.length) {
      throw new CustomError('No file ids were provided.', 400);
    }

    const data = await db.caseFile.createMany({
      data: caseFiles,
    });

    await logActivity({
      activityType: 'ADD_CASE_FILES',
      activityValue: `User (${user?.Email} - ${user?.IdpId}) added case files (${caseFiles.map(cf => [cf.UserFileId, cf.Status])}) for case ${caseId}`,
      userId: user?.id!,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: caseId,
      activityRelatedEntity: 'CASE',
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
