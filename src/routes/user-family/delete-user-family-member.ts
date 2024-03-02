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
import { DeleteFamilyMemberRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import {
  DeleteFamilyMemberRequestSchema,
  DeleteUsersFamilyResponseSchema,
} from '../../lib/route-schemas/user-family.schema';

export const routeSchema: RouteSchema = {
  requestBody: DeleteFamilyMemberRequestSchema,
  responseBody: DeleteUsersFamilyResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: DeleteFamilyMemberRequest = input.body;

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user.id;

  // This action deletes a user member and remove them from created cases.
  try {
    // We use a transaction because we want to perform each individual deletes
    // and check that family member being deleted actualy belongs to the user.
    const response = await db.$transaction(async tx => {
      const proResponse = await Promise.all(
        requestBody.map(async item => {
          await tx.userFamilyMember.softDelete({
            where: {
              UserId: userId,
              id: item,
            },
          });

          // Delete the associated case applicants
          await tx.caseApplicant.softDeleteMany({
            where: {
              UserFamilyMemberId: item,
            },
          });
        }),
      );
      return proResponse;
    });
    return response;
  } catch (error) {
    console.error('delete error: ', error);
    throw new CustomError('Unable to perform delete', 500);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
