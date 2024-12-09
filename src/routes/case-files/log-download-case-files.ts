import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';

import { getDB } from '../../lib/db';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { LogDownloadCaseFilesSchema } from '../../lib/route-schemas/case-file.schema';
import { LogDownloadCaseFile } from '../../lib/route-interfaces';
import { logActivity } from '../../lib/sqs';
import { CLIENT } from '../../lib/constants';
import { ActivityLogMessageType, ActivityLogType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  requestBody: LogDownloadCaseFilesSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const requestBody = input.body as LogDownloadCaseFile;

  const caseFiles = await db.caseFile.findMany({
    where: {
      id: {
        in: requestBody.caseFileIds,
      },
      Case: {
        CaseTeamAssignments: {
          some: {
            UserId: user.id,
          },
        },
      },
    },
    include: {
      CaseCriterion: true,
      GeneratedFile: {
        include: {
          UserFamilyMember: true,
        },
      },
      Case: {
        include: {
          CaseTeamAssignments: {
            where: {
              CaseRole: CLIENT,
            },
            include: {
              User: true,
            },
          },
        },
      },
    },
  });
  let activityType: ActivityLogType =
    requestBody.caseFileIds.length > 1 ? 'AGENT_DOWNLOAD_ALL_CASE_FILES' : 'AGENT_DOWNLOAD_CASE_FILE_CLIENT';
  if (caseFiles.length === 1 && caseFiles[0].GeneratedFile?.UserFamilyMember) {
    activityType = 'AGENT_DOWNLOAD_CASE_FILE_FAMILY_MEMBER';
  }
  if (caseFiles.length) {
    const activityData: ActivityLogMessageType = {
      activityType,
      activityValue: JSON.stringify({
        value: caseFiles,
        case: caseFiles[0].Case,
      }),
      userId: user.id,
      caseFilIds: caseFiles.map(cf => cf.id),
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: caseFiles[0].id,
      activityRelatedEntity: 'CASE_FILE',
    };

    await logActivity({ ...activityData, activityCategory: 'case' });
  }

  return caseFiles;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
