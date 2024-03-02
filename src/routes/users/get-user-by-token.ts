import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import userSchema from '../../lib/route-schemas/user.schema';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { getDB } from '../../lib/db';

export const routeSchema: RouteSchema = {
  responseBody: userSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();
    const jwt: NycIdJwtType = input.routeData.jwt;
    const user = await getUserByIdpId(jwt?.GUID);

    // The above user has very little information.  We need to get the full user.

    // Get the full user
    const fullUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        CaseCriteria: true,
        UserFamilyMembers: true,
        UserFiles: true,
        UserWorkflows: {
          include: {
            Workflow: true,
          },
        },
        CaseTeamAssignments: true,
        CaseNotes: true,
      },
    });
    return fullUser;
  } catch (e) {
    throw new CustomError('Error while getting the user', 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
