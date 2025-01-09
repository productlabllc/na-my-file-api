import {
  CBO_STAFF_AGENTS,
  CBO_SUPERVISORS,
  DHS_ADMINS,
  DHS_AGENTS,
  HPD_ADMINS,
  HPD_AGENTS,
  PATH_ADMINS,
  PATH_AGENTS,
  SPONSOR_USERS,
  STAKEHOLDER_GROUP_ROLES as sgr,
} from '../constants';
import { getDB } from '../db';

export default async function createUser(userParam: {
  IdpId?: string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  DOB?: string;
  LanguageIsoCode?: string;
  GUID?: string;
}) {
  const db = await getDB();
  const newUser = await db.$transaction(async tx => {
    const isPathUser = PATH_AGENTS.includes(userParam?.Email ?? '');

    const isDHSUser = DHS_AGENTS.includes(userParam?.Email ?? '');

    const isSponsor = SPONSOR_USERS.includes(userParam?.Email ?? '');

    const isCboStaffer = CBO_STAFF_AGENTS.includes(userParam?.Email ?? '');

    const isPathAdmin = PATH_ADMINS.includes(userParam.Email ?? '');

    const isDHSAdmin = DHS_ADMINS.includes(userParam.Email ?? '');

    const isHPDAdmin = HPD_ADMINS.includes(userParam.Email ?? '');

    const isHpdUser = HPD_AGENTS.includes(userParam?.Email ?? '');

    const isCBOSupervisor = CBO_SUPERVISORS.includes(userParam.Email ?? '');

    const workflowType = [] as string[];

    let role:
      | typeof sgr.CLIENT
      | typeof sgr.CBO_STAFFER
      | typeof sgr.CBO_SUPERVISOR
      | typeof sgr.SPONSOR
      | typeof sgr.DHS_ADMIN
      | typeof sgr.HPD_ADMIN
      | typeof sgr.PATH_ADMIN
      | typeof sgr.DHS_AGENT
      | typeof sgr.PATH_AGENT
      | typeof sgr.HPD_AGENT = sgr.CLIENT;

    if (isSponsor || isCboStaffer || isCBOSupervisor || isHPDAdmin || isHpdUser) {
      workflowType.push('HPD');
      if (isCboStaffer) {
        role = sgr.CBO_STAFFER;
      } else if (isCBOSupervisor) {
        role = sgr.CBO_SUPERVISOR;
      } else if (isSponsor) {
        role = sgr.SPONSOR;
      } else if (isHPDAdmin) {
        role = sgr.HPD_ADMIN;
      } else if (isHpdUser) {
        role = sgr.HPD_AGENT;
      }
    } else if (isDHSUser) {
      workflowType.push('DHS');
      role = sgr.DHS_AGENT;
    } else if (isPathUser) {
      workflowType.push('PATH');
      role = sgr.PATH_AGENT;
    } else if (isPathAdmin) {
      workflowType.push('PATH');
      role = sgr.PATH_ADMIN;
    } else if (isDHSAdmin) {
      workflowType.push('DHS');
      role = sgr.DHS_ADMIN;
    }

    const cases = await db.case.findMany({
      where: {
        CaseType: {
          in: workflowType,
        },
      },
    });

    const stakeholderRole = await db.stakeholderGroupRole.findFirst({
      where: {
        Name: role,
      },
    });

    const user = await tx.user.create({
      data: {
        FirstName: userParam.FirstName,
        LastName: userParam.LastName,
        Email: userParam.Email,
        DOB: userParam.DOB,
        LegacyId: userParam.IdpId,
        LanguageIsoCode: userParam.LanguageIsoCode,
        IdpId: userParam.GUID,
        ...(stakeholderRole
          ? {
              StakeholderGroupRoles: {
                create: {
                  StakeholderGroupRoleId: stakeholderRole.id,
                },
              },
            }
          : {}),
        ...(role && role !== sgr.CLIENT
          ? {
              CaseTeamAssignments: {
                createMany: {
                  data: cases.map(ele => {
                    return {
                      CaseId: ele.id,
                      CaseRole: role,
                    };
                  }),
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        Email: true,
        CreatedAt: true,
        DOB: true,
        TOSAcceptedAt: true,
        PPAcceptedAt: true,
      },
    });

    return user;
  });

  return newUser;
}
