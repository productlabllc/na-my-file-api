import Joi = require('joi');

import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';

import { getDB } from '../../lib/db';

import { AddCaseFileRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CAN_ADD_CASE_FILE_WORKFLOW_ROLES, CASE_FILE_STATUS, CLIENT, RuleSets } from '../../lib/constants';
import { AddCaseFileRequestSchema } from '../../lib/route-schemas/case-file.schema';
import { logActivity, triggerCaseCriterionCalculation } from '../../lib/sqs';
import { ActivityLogMessageType, ActivityLogType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  params: {
    caseId: Joi.string().uuid(),
  },
  query: {
    userId: Joi.string().uuid(),
  },
  requestBody: AddCaseFileRequestSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { caseId } = input.params as { caseId: string };
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const requestBody: AddCaseFileRequest = input.body;

  // make sure case exists.
  const existingCase = await db.case.findFirst({
    where: {
      AND: {
        id: caseId,
        DeletedAt: null,
      },
    },
    // Select the user having this case as the user doing the update might not be the case owner.
    include: {
      CaseApplicants: {
        include: {
          UserFamilyMember: true,
        },
      },
      CaseTeamAssignments: {
        include: {
          User: {
            include: {
              StakeholderGroupRoles: {
                include: {
                  StakeholderGroupRole: true,
                },
              },
            },
          },
        },
      },
      CaseFiles: {
        where: {
          GeneratedFileId: {
            in: requestBody.GeneratedFileIds,
          },
          CaseCriterionId: requestBody.CaseCriterionId,
          DeletedAt: null,
        },
        include: {
          GeneratedFile: true,
        },
      },
    },
  });

  if (existingCase) {
    // make sure this use can add files to case

    /**
     * Only case owners and users in `CAN_ADD_CASE_FILE_WORKFLOW_ROLES` can add case files.
     */

    const isCaseOWner = existingCase.CaseTeamAssignments.find(ele => ele.CaseRole === CLIENT)?.UserId === user.id;

    const userCaseTeamMember = existingCase.CaseTeamAssignments.find(ele => ele.UserId === user.id);

    const userRoles = userCaseTeamMember?.User?.StakeholderGroupRoles.map(ele => ele.StakeholderGroupRole?.Name);

    // Sponsor role cannot add case files
    const allRolesThatCanAddCaseFiles = CAN_ADD_CASE_FILE_WORKFLOW_ROLES.filter(ele => ele !== 'Sponsor');

    // Determine if the current user, based on their role, can add case files
    const roleCanAddCaseFile = userRoles?.some(role => allRolesThatCanAddCaseFiles.includes(role as any));

    if (!isCaseOWner && !roleCanAddCaseFile) {
      throw new CustomError(JSON.stringify({ message: 'User does not have permission to add files to case' }), 403);
    }

    // create db payload to add new case files
    const caseFiles = requestBody.GeneratedFileIds.map(ele => ({
      GeneratedFileId: ele,
      Status: CASE_FILE_STATUS.PENDING,
      CaseCriterionId: requestBody.CaseCriterionId,
      CaseId: caseId,
    }));

    // The existing case preloads any CaseFiles that contain the generatedFileIds passed in for the same criteria id
    // If there are any CaseFiles found that match the same generatedFileId + criteriaId, then this cannot be created new -- as it would be a duplicate
    // it can only be updated and must use the update-case-file endpoint
    if (existingCase.CaseFiles.length) {
      throw new CustomError(
        JSON.stringify({
          message: `Case files already exists: 
        ${existingCase.CaseFiles.map(ele => ele.GeneratedFile?.id).join(', ')}`,
        }),
        409,
      );
    }

    // make sure user has these files
    const requestGeneratedFile = await db.generatedFile.findMany({
      where: {
        FromUserFiles: {
          some: {
            OwnerUserId: user.id,
          },
        },
        id: {
          in: requestBody.GeneratedFileIds,
        },
        DeletedAt: null,
      },
      include: {
        UserFamilyMember: true,
      },
    });

    const userHasFiles = requestGeneratedFile.every(generatedFile =>
      requestBody.GeneratedFileIds.includes(generatedFile.id),
    );
    if (requestGeneratedFile.length !== requestBody.GeneratedFileIds.length && userHasFiles) {
      throw new CustomError(JSON.stringify({ message: 'Provided files not belonging to this user' }), 400);
    }

    /**
     * If generated files have family members, make sure these family members
     * are among the case applicants
     */

    const familyMemberIds = requestGeneratedFile
      .map(generatedFile => generatedFile?.UserFamilyMember?.id)
      .filter(ele => ele);

    if (familyMemberIds.length) {
      const caseApplicants = existingCase.CaseApplicants.map(ca => ca.UserFamilyMemberId);
      const missingMembers = familyMemberIds.filter(fm => !caseApplicants.includes(fm!));

      if (missingMembers.length) {
        throw new CustomError(
          JSON.stringify({
            message: 'Some family members associated to these files are not listed as applicants to this case.',
            missingMembers,
          }),
          400,
        );
      }
    }

    /**
     * make sure these files are going to fulfill a criterion.
     */
    const criterion = await db.caseCriterion.findFirst({
      where: {
        id: requestBody.CaseCriterionId,
      },
    });

    const ruleSets = JSON.parse((criterion?.RuleSets as string) ?? '[]') as RuleSets[];

    const fileTypes = requestGeneratedFile.map(file => file.FileType);

    const ruleSetsFileTypes = ruleSets
      .filter(rule => rule.field === 'fileType')
      .map(ele => ele.value)
      .flat()
      .map(ele => ele.name);

    const typeFulfilled = fileTypes.every(fileType => ruleSetsFileTypes.map(ele => ele).includes(fileType as any));

    if (!typeFulfilled) {
      throw new CustomError(
        JSON.stringify({
          message: `Document must be in type: ${JSON.stringify(ruleSetsFileTypes)}`,
          ruleSetsFileTypes,
        }),
        400,
      );
    }

    const deletedRejectCaseFiles = await db.caseFile.findMany({
      where: {
        CaseId: caseId,
        CaseCriterionId: requestBody.CaseCriterionId,
        Status: CASE_FILE_STATUS.REJECT,
        DeletedAt: {
          not: null,
        },
      },
      include: {
        GeneratedFile: {
          include: {
            UserFamilyMember: true,
          },
        },
      },
    });

    // Create the new case files
    const data = await db.caseFile.createMany({
      data: caseFiles,
    });

    // retrieve the newly-created case files
    const newCaseFiles = await db.caseFile.findMany({
      where: {
        GeneratedFileId: {
          in: caseFiles.map(cf => cf.GeneratedFileId),
        },
        DeletedAt: null,
        CaseCriterionId: requestBody.CaseCriterionId,
      },
      include: {
        CaseCriterion: true,
        GeneratedFile: {
          include: {
            UserFamilyMember: true,
          },
        },
      },
    });

    /**
     * Verify Case Criterion fulfillment end.
     */
    await triggerCaseCriterionCalculation({
      caseId: caseId,
      caseCriterionId: requestBody.CaseCriterionId,
    });

    /**
     * Deleted Rejected case files having family members
     */
    const deletedRejectedCaseFilesFamilyMembers = deletedRejectCaseFiles
      .filter(caseFile => caseFile.GeneratedFile?.FamilyMemberId)
      .map(caseFile => caseFile.GeneratedFile?.UserFamilyMember)
      .filter(i => i);

    const deletedRejectedClientCaseFiles = deletedRejectCaseFiles
      .filter(caseFile => !caseFile.GeneratedFile?.FamilyMemberId)
      .filter(i => i);

    let logType: ActivityLogType = 'CLIENT_ADD_CASE_FILES_SELF';

    const resubmitFamilyMemberIds = familyMemberIds
      .filter(familyMemberId => deletedRejectedCaseFilesFamilyMembers.some(item => item?.id === familyMemberId))
      .filter(i => i);

    const newFamilyMemberIds = familyMemberIds
      .filter(familyMember => !deletedRejectedCaseFilesFamilyMembers.some(item => item?.id === familyMember))
      .filter(i => i);

    const hasDeletedClientFiles = deletedRejectedClientCaseFiles.some(
      deletedCaseFile => !deletedCaseFile.GeneratedFile?.FamilyMemberId,
    );

    /**
     * If some deleted case files initially included some family members, the client might be updating the case file for a
     * family member. We need to check if any and log the appropriate activity log.
     */
    const resubmitFamilyMemberCaseFiles = newCaseFiles.filter(caseFile =>
      resubmitFamilyMemberIds.includes(caseFile.GeneratedFile?.FamilyMemberId!),
    );

    /**
     * Same as for family members, client might have deleted case files belonging to themselves,
     * We want track that and log the appropriate activity log.
     */
    const resubmitClientCaseFiles = newCaseFiles.filter(
      caseFile => !caseFile.GeneratedFile?.FamilyMemberId && hasDeletedClientFiles,
    );

    /**
     * We might have new family members documents being added.
     * We also need to log for those.
     */
    const newFamilyMembersCaseFiles = newCaseFiles.filter(caseFile =>
      newFamilyMemberIds.includes(caseFile.GeneratedFile?.FamilyMemberId!),
    );

    /**
     * We might also have new client files being added
     */
    const newClientCaseFiles = newCaseFiles.filter(
      caseFile => !caseFile.GeneratedFile?.FamilyMemberId && !hasDeletedClientFiles,
    );

    if (resubmitFamilyMemberCaseFiles.length) {
      const activityData: ActivityLogMessageType = {
        activityType: 'CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER',
        activityValue: JSON.stringify({
          newValue: resubmitFamilyMemberCaseFiles,
          familyMember: resubmitFamilyMemberCaseFiles.map(caseFile => caseFile.GeneratedFile?.UserFamilyMember),
          case: { ...existingCase, CaseTeamAssignments: undefined, CaseFiles: undefined },
        }),
        userId: user?.id!,
        familyMemberIds: resubmitFamilyMemberIds as string[],
        caseFilIds: resubmitFamilyMemberCaseFiles.map(cf => cf.id),
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: caseId,
        activityRelatedEntity: 'CASE_FILE',
      };

      await logActivity({ ...activityData, activityCategory: 'case' });
    }

    if (resubmitClientCaseFiles.length) {
      logType = 'CLIENT_RESUBMIT_CASE_FILES_SELF';

      const activityData: ActivityLogMessageType = {
        activityType: logType,
        activityValue: JSON.stringify({
          newValue: resubmitClientCaseFiles,
          case: { ...existingCase, CaseTeamAssignments: undefined, CaseFiles: undefined },
        }),
        userId: user?.id!,
        caseFilIds: resubmitClientCaseFiles.map(cf => cf.id),
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: caseId,
        activityRelatedEntity: 'CASE_FILE',
      };

      await logActivity({ ...activityData, activityCategory: 'case' });
    }

    if (newFamilyMembersCaseFiles.length) {
      const activityData: ActivityLogMessageType = {
        activityType: 'CLIENT_ADD_CASE_FILES_FAMILY_MEMBER',
        activityValue: JSON.stringify({
          newValue: newFamilyMembersCaseFiles,
          familyMember: newFamilyMembersCaseFiles.map(caseFile => caseFile.GeneratedFile?.UserFamilyMember),
          case: { ...existingCase, CaseTeamAssignments: undefined, CaseFiles: undefined },
        }),
        userId: user?.id!,
        caseFilIds: newCaseFiles.map(cf => cf.id),
        familyMemberIds: newFamilyMemberIds as string[],
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: caseId,
        activityRelatedEntity: 'CASE_FILE',
      };

      await logActivity({ ...activityData, activityCategory: 'case' });
    }

    if (newClientCaseFiles.length) {
      logType = 'CLIENT_ADD_CASE_FILES_SELF';

      const activityData: ActivityLogMessageType = {
        activityType: logType,
        activityValue: JSON.stringify({
          newValue: newClientCaseFiles,
          case: { ...existingCase, CaseTeamAssignments: undefined, CaseFiles: undefined },
        }),
        userId: user?.id!,
        caseFilIds: newClientCaseFiles.map(cf => cf.id),
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input }),
        activityRelatedEntityId: caseId,
        activityRelatedEntity: 'CASE_FILE',
      };

      await logActivity({ ...activityData, activityCategory: 'case' });
    }

    return data;
  } else {
    throw new CustomError(JSON.stringify({ message: 'Case Not Found' }), 400);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
