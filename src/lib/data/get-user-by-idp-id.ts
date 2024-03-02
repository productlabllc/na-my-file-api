import { CustomError } from '@myfile/core-sdk';
import { getDB } from '../db';

export const getUserByIdpId = async (idpId: string) => {
  const db = getDB();
  const user = await db.user.findFirst({
    where: {
      IdpId: idpId,
      DeletedAt: null,
    },
    include: {
      StakeholderGroupRoles: {
        include: {
          StakeholderGroupRole: true,
        },
      },
    },
  });

  if (!user) {
    throw new CustomError('User not found', 400);
  }
  return user;
};
