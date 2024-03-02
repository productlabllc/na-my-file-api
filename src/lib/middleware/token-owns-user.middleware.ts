import { CustomError, RouteArguments } from '@myfile/core-sdk';
import { getUserByIdpId } from '../data/get-user-by-idp-id';
import _ from 'lodash';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';

export const tokenOwnsRequestedUser =
  (idpIdPath: string) =>
  async (incomingData: RouteArguments): Promise<RouteArguments> => {
    const { routeData = {} } = incomingData;
    const idpId = _.get(incomingData, idpIdPath, null) as string | null;
    if (!idpId) {
      throw new CustomError(`partnerId at path "${idpIdPath}" was not found.`, 401);
    }
    const jwt = incomingData.routeData.jwt as NycIdJwtType | undefined | null;
    if (!jwt) {
      throw new CustomError('Token does not exist.', 403);
    }
    const user = await getUserByIdpId(jwt['GUID']);
    if (!user) {
      throw new CustomError('User does not exist.', 401);
    } else {
      if (jwt['GUID'] !== idpId) {
        throw new CustomError(
          `User's can perform profile modifications only unto themselves. ${jwt['GUID']} != ${idpId}.`,
          403,
        );
      }
    }
    return { ...incomingData };
  };

export default tokenOwnsRequestedUser;
