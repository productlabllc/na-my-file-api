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
import { LogViewCaseFamilyMemberSchema } from '../../lib/route-schemas/case-file.schema';
import { LogViewCaseFamilyMember } from '../../lib/route-interfaces';

const routeSchema: RouteSchema = {
  requestBody: LogViewCaseFamilyMemberSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const requestBody = input.body as LogViewCaseFamilyMember;

  const thisCase = await db.case.findFirst({
    where: {
      id: requestBody.CaseId,

      CaseTeamAssignments: {
        some: {
          UserId: user.id,
        },
      },
    },

    include: {
      CaseTeamAssignments: {
        where: {
          DeletedAt: null,
          CaseRole: CLIENT,
        },
        include: {
          User: {
            where: {
              DeletedAt: null,
            },
          },
        },
      },
      CaseApplicants: {
        where: {
          DeletedAt: null,
        },
        include: {
          UserFamilyMember: {
            where: {
              DeletedAt: null,
            },
          },
        },
      },
    },
  });
  if (thisCase) {
    await logActivity({
      activityType: 'CLIENT_VIEW_CASE_TEAM_MEMBERS',
      familyMemberIds: thisCase.CaseApplicants.map(ca => ca.UserFamilyMemberId!),
      activityValue: JSON.stringify({
        value: thisCase,
        case: thisCase,
      }),
      userId: user.id,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
      activityRelatedEntityId: thisCase.id,
      activityRelatedEntity: 'CASE',
    });
  }

  return thisCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
