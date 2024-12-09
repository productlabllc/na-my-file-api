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
import { logActivity } from '../../lib/sqs';
import { CLIENT } from '../../lib/constants';
import { LogPreviewCaseFileSchema } from '../../lib/route-schemas/case-file.schema';
import { LogPreviewCaseFile } from '../../lib/route-interfaces';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

const routeSchema: RouteSchema = {
  requestBody: LogPreviewCaseFileSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const requestBody = input.body as LogPreviewCaseFile;

  const caseFile = await db.caseFile.findFirst({
    where: {
      id: requestBody.caseFileId,
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
  if (caseFile) {
    const activityLogData: ActivityLogMessageType = {
      activityType: 'AGENT_PREVIEW_CASE_FILE',
      activityValue: JSON.stringify({
        value: caseFile,
        case: caseFile.Case,
      }),
      userId: user.id,
      caseFilIds: [caseFile.id],
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: caseFile.id,
      activityRelatedEntity: 'CASE_FILE',
    };

    await logActivity({ ...activityLogData, activityCategory: 'case' });
  }

  return caseFile;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
