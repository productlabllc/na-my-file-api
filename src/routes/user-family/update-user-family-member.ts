import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { UpdateUserFamilyRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import {
  UpdateUserFamilyRequestSchema,
  UpdateUserFamilyResponseSchema,
} from '../../lib/route-schemas/user-family.schema';

export const routeSchema: RouteSchema = {
  requestBody: UpdateUserFamilyRequestSchema,
  responseBody: UpdateUserFamilyResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: UpdateUserFamilyRequest = input.body;

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user.id;

  const dataUpdateKeys = Object.keys(requestBody) as Array<keyof UpdateUserFamilyRequest>;
  dataUpdateKeys.forEach(key => {
    if (requestBody[key] === undefined || requestBody[key] === null) {
      delete requestBody[key];
    }
  });

  const newData = { ...requestBody } as Partial<typeof requestBody>;
  delete newData.id;

  const updatedUser = await db.userFamilyMember.update({
    data: newData,
    where: {
      id: requestBody.id,
      AND: {
        UserId: userId,
      },
    },
    select: {
      User: true,
      FirstName: true,
      LastName: true,
      UserFiles: true,
      Relationship: true,
      CaseApplicants: true,
      DOB: true,
      LastModifiedAt: true,
    },
  });

  return updatedUser;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
