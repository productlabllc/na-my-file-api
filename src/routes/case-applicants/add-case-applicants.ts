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
import {
  AddCaseApplicantsRequestSchema,
  AddCaseApplicantsResponseSchema,
} from '../../lib/route-schemas/case-applicant.schema';
import { AddCaseApplicantsRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { CASE_OWNER } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: AddCaseApplicantsRequestSchema,
  responseBody: AddCaseApplicantsResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user?.id;

  const requestBody: AddCaseApplicantsRequest = input.body;

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
      CaseApplicants: {
        where: {
          UserFamilyMemberId: {
            in: requestBody.map(ele => ele.UserFamilyMemberId),
          },
          DeletedAt: null,
        },
        select: {
          UserFamilyMemberId: true,
        },
      },
    },
  });

  if (thisCase) {
    const caseParticipants = requestBody.map(ele => ({
      ...ele,
      CaseId: caseId,
    }));

    if (thisCase.CaseApplicants.length) {
      throw new CustomError(
        `Case Applicants already exists: 
        ${thisCase.CaseApplicants.map(ele => ele.UserFamilyMemberId).join(', ')}`,
        409,
      );
    }

    // make sure user has this family member
    const userFamilyMembers = await db.userFamilyMember.findMany({
      where: {
        id: {
          in: requestBody.map(ele => ele.UserFamilyMemberId),
        },
        UserId: userId,
        DeletedAt: null,
      },
    });

    if (userFamilyMembers.length !== requestBody.length) {
      throw new CustomError('User does not have all these family members', 400);
    }

    const data = await db.caseApplicant.createMany({
      data: caseParticipants,
    });

    return data;
  } else {
    throw new CustomError('Case Not Found', 404);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
