import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { GetCasesResponseSchema } from '../../lib/route-schemas/case.schema';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { CASE_OWNER } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  responseBody: GetCasesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user.id;

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

  return overallCase;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
