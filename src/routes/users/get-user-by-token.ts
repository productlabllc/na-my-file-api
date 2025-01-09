import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { getDB } from '../../lib/db';
import { BaseUserSchema } from '../../lib/route-schemas/base-models.schema';
import createUser from '../../lib/data/create-user-nyc';

export const routeSchema: RouteSchema = {
  responseBody: BaseUserSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();
    const jwt: CognitoJwtType = input.routeData.jwt;
    let user = await getUserByEmail(jwt?.email);
    if (!user) {
      const newUser = await createUser({
        FirstName: jwt.given_name,
        LastName: jwt.family_name,
        GUID: jwt.sub,
        IdpId: jwt.sub,
        Email: jwt.email,
      });

      return newUser;
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
