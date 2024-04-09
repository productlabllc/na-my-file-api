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
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { getDB } from '../../lib/db';

export const routeSchema: RouteSchema = {
  responseBody: userSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();
    const jwt: NycIdJwtType = input.routeData.jwt;
    let user = await getUserByEmail(jwt?.email);
    if (!user) {
      await db.user.create({
        data: {
          Email: jwt?.email,
          FirstName: jwt?.given_name,
          LastName: jwt?.family_name,
          IdpId: jwt?.uid,
        },
      });
      user = await getUserByEmail(jwt?.email);
    }
    return user;
  } catch (e) {
    if (e instanceof CustomError) {
      throw e;
    } else {
      throw new CustomError(JSON.stringify(e, null, 2), 500);
    }
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
