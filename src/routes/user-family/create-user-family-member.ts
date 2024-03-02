import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { CreateFamilyMemberRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import {
  CreateUserFamilyRequestSchema,
  CreateUserFamilyResponseSchema,
} from '../../lib/route-schemas/user-family.schema';

export const routeSchema: RouteSchema = {
  requestBody: CreateUserFamilyRequestSchema,
  responseBody: CreateUserFamilyResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: CreateFamilyMemberRequest = input.body;

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

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

  return familyMember;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
