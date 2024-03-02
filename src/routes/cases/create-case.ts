import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { CreateCaseRequestBodySchema, CreateCaseResponseSchema } from '../../lib/route-schemas/case.schema';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { CreateCaseRequestBody } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { CASE_OWNER } from '../../lib/constants';

export const routeSchema: RouteSchema = {
  requestBody: CreateCaseRequestBodySchema,
  responseBody: CreateCaseResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: CreateCaseRequestBody = input.body;

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user.id;

  return await db.$transaction(async db => {
    const caseTitle = requestBody.CaseTitle ?? `${user.LastName}, ${user.FirstName}  ${requestBody.CaseType}`;

    const caseObject = await db.case.create({
      data: {
        CaseType: requestBody.CaseType,
        Title: caseTitle,
        CaseAttributes: requestBody.CaseAttributes,
        AgencyCaseIdentifier: requestBody.CaseIdentifier,
      },
      select: {
        id: true,
      },
    });

    const caseApplicants = await Promise.all(
      requestBody.FamilyMemberIds?.map(async member => {
        // does this user has this family member?
        const userFamilyMember = await db.userFamilyMember.findFirst({
          where: {
            id: member,
            UserId: userId,
            DeletedAt: null,
          },
        });

        if (!userFamilyMember) {
          throw new CustomError(`User does not have this family member ${member}`, 400);
        }

        return {
          UserFamilyMemberId: member,
          CaseId: caseObject.id,
        };
      }) ?? [],
    );

    if (caseApplicants?.length) {
      await db.caseApplicant.createMany({ data: caseApplicants, skipDuplicates: true });
    }

    const caseTeamAssignment = {
      UserId: userId,
      CaseRole: CASE_OWNER,
      CaseId: caseObject.id,
    };

    await db.caseTeamAssignment.create({ data: caseTeamAssignment });

    const overallCase = await db.case.findFirst({
      where: {
        id: caseObject.id,
        DeletedAt: null,
      },
      include: {
        CaseApplicants: true,
        CaseTeamAssignments: true,
      },
    });

    return overallCase;
  });
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
