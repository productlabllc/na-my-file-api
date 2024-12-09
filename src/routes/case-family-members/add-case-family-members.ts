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
import {
  AddCaseFamilyMembersRequestSchema,
  AddCaseApplicantsResponseSchema,
} from '../../lib/route-schemas/case-applicant.schema';
import { AddCaseFamilyMembersRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CASE_OWNER } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  requestBody: AddCaseFamilyMembersRequestSchema,
  responseBody: AddCaseApplicantsResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const requestBody: AddCaseFamilyMembersRequest = input.body;

  // make sure case exists and user is owner
  const existingCase = await db.case.findFirst({
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

  if (existingCase) {
    const caseParticipants = requestBody.map(ele => ({
      ...ele,
      CaseId: caseId,
    }));

    if (existingCase.CaseApplicants.length) {
      throw new CustomError(
        `Case Applicants already exists: 
        ${existingCase.CaseApplicants.map(ele => ele.UserFamilyMemberId).join(', ')}`,
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

    await logActivity({
      activityType: 'ADD_CASE_FAMILY_MEMBERS',
      activityValue: `User (${user.Email} - ${userId}) added family members (${requestBody.map(item => item.UserFamilyMemberId)})`,
      userId: userId!,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input, affectedRows: data.count }),
      activityRelatedEntityId: caseId,
      activityRelatedEntity: 'CASE',
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
