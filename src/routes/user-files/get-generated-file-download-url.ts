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
import { GetUserFileDownloadUrlResponseSchema } from '../../lib/route-schemas/user-file.schema';
import { getPresignedDownloadUrl } from '../../lib/s3';
import { EnvironmentVariablesEnum } from '../../lib/environment';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { S3Prefix, STAKEHOLDER_GROUP_ROLES } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';

export const routeSchema: RouteSchema = {
  query: {
    generatedFileId: joi.string().required(),
    caseFileId: joi.string(),
    disposition: joi.string().valid('attachment', 'inline'),
    userId: joi.string(),
  },
  responseBody: GetUserFileDownloadUrlResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const db = getDB();
    const user = await getUserByEmail(input.routeData.jwt?.email);

    const {
      generatedFileId,
      userId,
      disposition = 'inline',
      caseFileId,
    } = input.query as {
      generatedFileId: string;
      caseFileId?: string;
      userId: string;
      disposition: 'attachment' | 'inline';
    };

    const canDownload = await user.canViewGeneratedFile(generatedFileId);

    const thisGeneratedFile = await db.generatedFile.findFirst({
      where: {
        id: generatedFileId,
        DeletedAt: null,
      },
      include: {
        FromUserFiles: {
          include: {
            UserFamilyMember: true,
          },
        },
      },
    });

    const userFileUserId = thisGeneratedFile?.FromUserFiles[0]?.OwnerUserId;

    const userHasThisFile = user.id === userFileUserId;

    const isAgent = user.StakeholderGroupRoles.some(
      sgr => sgr.StakeholderGroupRole?.Name !== STAKEHOLDER_GROUP_ROLES.CLIENT,
    );

    if (isAgent && !caseFileId) {
      throw new CustomError(JSON.stringify({ message: 'caseFileId is required for Agent Users' }), 400);
    }

    if (!canDownload && !userHasThisFile) {
      throw new CustomError(
        JSON.stringify({
          message: 'User does not have permission to download this file',
          userId: user.id,
          userFileUserId,
        }),
        403,
      );
    }

    if (!thisGeneratedFile) {
      throw new CustomError(JSON.stringify({ message: 'Generated file does not exist' }), 400);
    }

    const thisCase = caseFileId
      ? await db.case.findFirst({
          where: {
            CaseFiles: {
              some: {
                id: caseFileId,
              },
            },
          },
          include: {
            CaseFiles: {
              where: {
                id: caseFileId,
              },
              include: {
                CaseCriterion: true,
                GeneratedFile: {
                  include: {
                    CreateByUser: true,
                    UserFamilyMember: true,
                  },
                },
              },
            },
          },
        })
      : null;

    const presignedUrl = await getPresignedDownloadUrl(
      process.env[EnvironmentVariablesEnum.CLIENT_FILE_BUCKET_NAME]!,
      `${S3Prefix.GENERATED_FILES}${userId ?? user.id}/${generatedFileId}.pdf`,
      thisGeneratedFile.OriginalFilename!,
      disposition,
    );
    console.log(`presignedUrl: ${presignedUrl}`);

    const familyMember = thisGeneratedFile.FromUserFiles[0].UserFamilyMember;

    console.log(`User StakeholderGroupRoles: ${JSON.stringify(user.StakeholderGroupRoles, null, 2)}`);
    console.log(`isAgent: ${isAgent}`);

    if (disposition === 'attachment') {
      await logActivity({
        activityType: isAgent
          ? familyMember
            ? 'AGENT_DOWNLOAD_CASE_FILE_FAMILY_MEMBER'
            : 'AGENT_DOWNLOAD_CASE_FILE_CLIENT'
          : familyMember
            ? 'CLIENT_DOWNLOAD_DOCUMENT_FAMILY_MEMBER'
            : 'CLIENT_DOWNLOAD_DOCUMENT_SELF',
        activityValue: JSON.stringify({ familyMember, value: thisGeneratedFile, case: thisCase }),
        userId: user.id,
        caseFilIds: thisCase?.CaseFiles?.length ? thisCase.CaseFiles.map(cf => cf.id) : [],
        timestamp: new Date(),
        metadataJson: JSON.stringify({ request: input.query }),
        activityRelatedEntityId: thisGeneratedFile.id,
        activityRelatedEntity: isAgent ? 'CASE_FILE' : 'USER_FILE',
        activityCategory: isAgent ? 'case' : 'platform',
      });
    }

    return {
      downloadUrl: presignedUrl,
    };
  } catch (error: any) {
    console.warn('error: ', error);
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
