import { CustomError } from '@myfile/core-sdk';
import { getDB } from '../db';

export const getUserByEmail = async (email: string) => {
  const db = getDB();
  const user = await db.user.findFirst({
    where: {
      Email: email,
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
      StakeholderGroupRoles: {
        include: {
          StakeholderGroupRole: true,
        },
      },
    },
  });
  return user;
};
