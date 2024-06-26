import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CreateFamilyMemberRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import {
  CreateFamilyMemberRequestSchema,
  CreateFamilyMemberResponseSchema,
} from '../../lib/route-schemas/family-member.schema';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  requestBody: CreateFamilyMemberRequestSchema,
  responseBody: CreateFamilyMemberResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: CreateFamilyMemberRequest = input.body;

  const jwt: NycIdJwtType = input.routeData.jwt;

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

  await logActivity({
    activityType: 'CREATE_FAMILY_MEMBER',
    activityValue: `User (${user.Email} - ${user.IdpId}) created family member.`,
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
