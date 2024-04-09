import { CustomError, RouteArguments } from '@myfile/core-sdk';
import { getUserByEmail } from '../data/get-user-by-idp-id';
import _ = require('lodash');
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';

export const tokenOwnsRequestedUser =
  (userIdPath: string) =>
  async (incomingData: RouteArguments): Promise<RouteArguments> => {
    const { routeData = {} } = incomingData;
    const userId = _.get(incomingData, userIdPath, null) as string | null;
    if (!userId) {
      throw new CustomError(`userId in payload at path "${userIdPath}" was not found.`, 401);
    }
    const jwt = incomingData.routeData.jwt as NycIdJwtType | undefined | null;
    if (!jwt) {
      throw new CustomError('Token does not exist.', 403);
    }
    const user = await getUserByEmail(jwt?.email);
    if (!user) {
      throw new CustomError('User does not exist.', 401);
    } else {
      if (jwt['GUID'] !== userId) {
        throw new CustomError(
          `This user cannot perform this action only to items owned or created by themselves. ${jwt['GUID']} != ${userId}.`,
          403,
        );
      }
    }
    return { ...incomingData };
  };

export default tokenOwnsRequestedUser;
