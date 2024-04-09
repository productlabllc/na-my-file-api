import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { GetCasesResponseSchema } from '../../lib/route-schemas/case.schema';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { CASE_OWNER } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  responseBody: GetCasesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const caseTeamAssignment = {
    UserId: userId,
    CaseRole: CASE_OWNER,
  };

  const overallCase = await db.case.findMany({
    where: {
      CaseTeamAssignments: {
        every: caseTeamAssignment,
      },
      DeletedAt: null,
    },
    include: {
      CaseApplicants: true,
      CaseTeamAssignments: true,
      CaseCriteria: true,
      CaseFiles: true,
      CaseNotes: true,
    },
  });

  await logActivity({
    activityType: 'GET_ALL_USER_CASES',
    activityValue: `User (${user?.Email} - ${user?.IdpId}) retrieved a listing of all active cases.`,
    userId: user?.IdpId!,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
  });

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
