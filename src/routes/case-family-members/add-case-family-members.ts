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
import { CLIENT } from '../../lib/constants';
import { logActivity, triggerCaseCriterionCalculation } from '../../lib/sqs';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

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
            CaseRole: CLIENT,
          },
        },
      },
    },
    include: {
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
        JSON.stringify({
          message: `Case Applicants already exists: 
        ${existingCase.CaseApplicants.map(ele => ele.UserFamilyMemberId).join(', ')}`,
        }),
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
      throw new CustomError(JSON.stringify({ message: 'User does not have all these family members' }), 400);
    }

    const data = await db.caseApplicant.createMany({
      data: caseParticipants,
    });

    await triggerCaseCriterionCalculation({ caseId });

    const activityData: ActivityLogMessageType = {
      activityType: 'CLIENT_ADD_CASE_FAMILY_MEMBERS',
      activityValue: JSON.stringify({ newValue: userFamilyMembers, case: existingCase }),
      userId: userId!,
      familyMemberIds: userFamilyMembers.map(fm => fm.id),
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input, affectedRows: data.count }),
      activityRelatedEntityId: caseId,
      activityRelatedEntity: 'CASE_FAMILY_MEMBER',
    };

    await logActivity({ ...activityData, activityRelatedEntity: 'CASE', activityCategory: 'case' });

    return data;
  } else {
    throw new CustomError(JSON.stringify({ message: 'Case Not Found' }), 404);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
