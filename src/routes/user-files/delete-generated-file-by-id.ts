import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import joi = require('joi');
import { getDB } from '../../lib/db';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { logActivity, triggerCaseCriterionCalculation } from '../../lib/sqs';
import { UserFamilyMember } from '@prisma/client';
import { CLIENT } from '../../lib/constants';
import logRemoveCaseFiles from '../../lib/data/log-remove-case-files';

// Delete a generated file + attached user files
// This
export const routeSchema: RouteSchema = {
  query: {
    id: joi.string().required(),
  },
  responseBody: joi.object(),
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();

    const user = await getUserByEmail(input.routeData.jwt?.email);

    const { id } = input.query as { id: string };

    let familyMember: UserFamilyMember | null = {} as UserFamilyMember;

    const cases = await db.case.findMany({
      where: {
        CaseFiles: {
          some: {
            GeneratedFileId: id,
          },
        },
      },
    });

    const response = await db.$transaction(async () => {
      const userFiles = await db.userFile.findMany({
        where: { GeneratedFileId: id },
        include: { UserFamilyMember: true, GeneratedFile: true },
      });

      familyMember = userFiles[0].UserFamilyMember;

      const ids = userFiles.map(ele => ele.id);

      const associatedCaseFiles = await db.caseFile.findMany({
        where: {
          GeneratedFileId: id,
        },
        include: {
          CaseCriterion: {
            where: {
              DeletedAt: null,
            },
          },
          GeneratedFile: {
            include: {
              UserFamilyMember: {
                where: {
                  DeletedAt: null,
                },
              },
            },
          },
          Case: {
            where: {
              DeletedAt: null,
            },
            include: {
              CaseTeamAssignments: {
                include: {
                  User: true,
                },
                where: {
                  CaseRole: CLIENT,
                  DeletedAt: null,
                },
              },
            },
          },
        },
      });

      await db.caseFile.softDeleteMany({
        where: {
          GeneratedFileId: id,
        },
      });

      await db.uploadedMediaAssetVersion.softDeleteMany({
        where: {
          UserFileId: {
            in: ids,
          },
        },
      });

      await db.userFile.softDeleteMany({
        where: {
          DeletedAt: null,
          GeneratedFileId: id,
        },
      });

      await db.generatedFile.softDeleteMany({
        where: {
          CaseFiles: {
            none: {
              DeletedAt: null,
            },
          },
          id: id,
          DeletedAt: null,
        },
      });

      return { userFiles, associatedCaseFiles };
    });

    await Promise.all(cases.map(ele => triggerCaseCriterionCalculation({ caseId: ele.id })));

    await logRemoveCaseFiles(response.associatedCaseFiles, user, input);

    await logActivity({
      activityType: familyMember ? 'CLIENT_DELETE_DOCUMENT_FAMILY_MEMBER' : 'CLIENT_DELETE_DOCUMENT_SELF',
      activityValue: JSON.stringify({ familyMember, oldValue: response.userFiles[0]?.GeneratedFile }),
      userId: user.id,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input.query }),
      activityRelatedEntityId: id,
      activityRelatedEntity: 'USER_FILE',
    });

    return response;
  } catch (error: any) {
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
