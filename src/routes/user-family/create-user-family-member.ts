import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CreateFamilyMemberRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import {
  CreateFamilyMemberRequestSchema,
  CreateFamilyMemberResponseSchema,
} from '../../lib/route-schemas/family-member.schema';
import { logActivity } from '../../lib/sqs';
import { CASE_STATUS } from '../../lib/constants';

const routeSchema: RouteSchema = {
  requestBody: CreateFamilyMemberRequestSchema,
  responseBody: CreateFamilyMemberResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: CreateFamilyMemberRequest = input.body;

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user.id;

  const familyMember = await db.userFamilyMember.create({
    data: {
      ...requestBody,
      UserId: userId,
    },
    select: {
      id: true,
      User: true,
      FirstName: true,
      LastName: true,
      DOB: true,
      Relationship: true,
      CreatedAt: true,
      LastModifiedAt: true,
    },
  });

  const clientActiveCases = await db.case.findMany({
    where: {
      CaseTeamAssignments: {
        some: {
          UserId: userId,
        },
      },
      Status: CASE_STATUS.OPEN,
    },
  });

  for (let clientCase of clientActiveCases) {
    await db.caseApplicant.create({
      data: {
        CaseId: clientCase.id,
        UserFamilyMemberId: familyMember.id,
      },
    });
  }

  await logActivity({
    activityType: 'CLIENT_CREATE_FAMILY_MEMBER',
    activityValue: JSON.stringify({ newValue: familyMember }),
    familyMemberIds: [familyMember.id],
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input, familyMember }),
    activityRelatedEntityId: familyMember.id,
    activityRelatedEntity: 'FAMILY_MEMBER',
  });

  return familyMember;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
