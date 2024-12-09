import {
  Case,
  CaseCriterion,
  CaseFile,
  CaseTeamAssignment,
  GeneratedFile,
  User,
  UserFamilyMember,
} from '@prisma/client';
import { ActivityLogMessageType } from '../types-and-interfaces';
import { logActivity } from '../sqs';

export default async function logRemoveCaseFiles(
  caseFilesParams: (CaseFile & {
    GeneratedFile:
      | (GeneratedFile & {
          UserFamilyMember: UserFamilyMember | null;
        })
      | null;
    CaseCriterion: CaseCriterion | null;
    Case: (Case & { CaseTeamAssignment?: CaseTeamAssignment[] }) | null;
  })[],
  user: User,
  input: any,
) {
  const groupedCaseFiles = Object.values(
    caseFilesParams.reduce(
      (acc, current: (typeof caseFilesParams)[number]) => {
        if (acc[current?.CaseId!]) {
          acc[current.CaseId!].push(current);
        } else {
          acc[current.CaseId!] = [current];
        }

        return acc;
      },
      {} as Record<string, typeof caseFilesParams>,
    ),
  );

  for (let i = 0; i < groupedCaseFiles.length; i++) {
    const caseFiles = groupedCaseFiles[i];
    const existingCase = caseFiles[0].Case;
    const files = caseFiles.map(ele => ele.GeneratedFile?.UserFamilyMember);

    const filesWithFM = files.filter(fm => fm);

    const filesWithoutFM = files.filter(fm => !fm);

    if (filesWithoutFM.length) {
      const activityData: ActivityLogMessageType = {
        activityType: 'CLIENT_REMOVE_CASE_FILES_SELF',
        activityValue: JSON.stringify({
          oldValue: caseFiles.filter(cf => !cf.GeneratedFile?.FamilyMemberId),
          case: existingCase,
        }),
        userId: user.id,
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: existingCase?.id,
        activityRelatedEntity: 'CASE_FILE',
      };

      await logActivity({
        ...activityData,
        activityCategory: 'case',
        caseFilIds: caseFiles.map(cf => cf.id),
      });
    }

    if (filesWithFM.length) {
      const activityData: ActivityLogMessageType = {
        activityType: 'CLIENT_REMOVE_CASE_FILES_FAMILY_MEMBER',
        activityValue: JSON.stringify({
          oldValue: caseFiles.filter(cf => cf.GeneratedFile?.FamilyMemberId),
          familyMember: filesWithFM,
          case: { ...existingCase, CaseFiles: undefined },
        }),
        userId: user.id,
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: existingCase?.id,
        activityRelatedEntity: 'CASE_FILE',
      };

      await logActivity({
        ...activityData,
        activityCategory: 'case',
        caseFilIds: caseFiles.map(cf => cf.id),
      });
    }
  }
}
