import {
  CustomError,
  jwtValidationMiddleware,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import * as joi from 'joi';
import { GetUserSchema } from '../../lib/route-schemas/user.schema';
import { getDB } from '../../lib/db';
import { RouteModule } from 'aws-lambda-api-tools/dist/lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { STAKEHOLDER_GROUP_ROLES as stk } from '../../lib/constants';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
export const routeSchema: RouteSchema = {
  query: {},
  params: {
    userId: joi.string().required(),
  },
  requestBody: {},
  responseBody: GetUserSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = await getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;
  let tokenUser = await getUserByEmail(jwt?.email);

  const { userId } = input.params as { userId: string };

  /**
   * Can user read users
   */

  const userGroups = await db.user_StakeholderGroupRole.findMany({
    where: {
      UserId: tokenUser.id,
      DeletedAt: null,
    },
    include: {
      StakeholderGroupRole: {
        where: {
          DeletedAt: null,
        },
      },
    },
  });

  const admittedGroups = [
    stk.DHS_ADMIN,
    stk.DHS_AGENT,
    stk.HPD_ADMIN,
    stk.HPD_AGENT,
    stk.PATH_AGENT,
    stk.PATH_ADMIN,
    stk.PLATFORM_ADMIN,
    stk.CBO_STAFFER,
    stk.CBO_SUPERVISOR,
    stk.SPONSOR,
  ];

  const canViewUser = userGroups.some(ele => admittedGroups.includes(ele.StakeholderGroupRole?.Name ?? ('' as any)));

  if (!canViewUser) {
    throw new CustomError(JSON.stringify({ message: 'User does not have permission to view users' }), 400);
  }

  const user = await db.user.findFirst({
    where: {
      id: userId,
      DeletedAt: null,
    },
    include: {
      UserFamilyMembers: true,
      CaseTeamAssignments: {
        where: {
          DeletedAt: null,
        },
        include: {
          Case: {
            where: {
              DeletedAt: null,
            },
          },
        },
      },
    },
  });

  return user;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
