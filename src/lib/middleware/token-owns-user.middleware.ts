import { CustomError, RouteArguments } from 'aws-lambda-api-tools';
import { getUserByEmail } from '../data/get-user-by-idp-id';
import _ = require('lodash');
import { CognitoJwtType } from '../../lib/types-and-interfaces';

export const tokenOwnsRequestedUser =
  (cognitoIdPath: string) =>
  async (incomingData: RouteArguments): Promise<RouteArguments> => {
    const { routeData = {} } = incomingData;
    const cognitoId = _.get(incomingData, cognitoIdPath, null) as string | null;
    if (!cognitoId) {
      throw new CustomError(
        JSON.stringify({ message: `userId in payload at path "${cognitoIdPath}" was not found.` }),
        401,
      );
    }
    const jwt = incomingData.routeData.jwt as CognitoJwtType | undefined | null;
    if (!jwt) {
      throw new CustomError(JSON.stringify({ message: 'Token does not exist.' }), 403);
    }
    const user = await getUserByEmail(jwt?.email);
    if (!user) {
      throw new CustomError('User does not exist.', 401);
    } else {
      if (jwt['cognito:username'] !== cognitoId) {
        throw new CustomError(
          `User's can perform profile modifications only unto themselves. ${jwt['cognito:username']} != ${cognitoId}.`,
          403,
        );
      }
    }
    return { ...incomingData };
  };

export default tokenOwnsRequestedUser;
