import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { CreateCaseRequestBodySchema, CreateCaseResponseSchema } from '../../lib/route-schemas/case.schema';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CreateCaseRequestBody } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { CASE_CRITERION_STATUS, CASE_OWNER } from '../../lib/constants';
import { CaseCriterion } from '@prisma/client';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  requestBody: CreateCaseRequestBodySchema,
  responseBody: CreateCaseResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: CreateCaseRequestBody = input.body;

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user.id;

  return await db.$transaction(async db => {
    const caseTitle = requestBody.CaseTitle ?? `${user.LastName}, ${user.FirstName}  ${requestBody.CaseType}`;

    const newCase = await db.case.create({
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

    const workflowStages = await db.workflowStage.findMany({
      where: {
        WorkflowId: requestBody.WorkflowId,
      },
      select: {
        WorkflowStageCriteria: true,
        id: true,
      },
    });

    const caseCriteria = workflowStages.reduce(
      (acc, workflowStage) => {
        return [
          ...acc,
          ...workflowStage.WorkflowStageCriteria.map(workStageCriterion => {
            return {
              CaseId: newCase.id,
              Status: CASE_CRITERION_STATUS.STARTED,
              WorkflowStageCriterionId: workStageCriterion.id,
              LastModifiedByUserId: user.id,
            };
          }),
        ];
      },
      [] as Array<Partial<CaseCriterion>>,
    );

    await db.caseCriterion.createMany({
      data: caseCriteria,
    });

    const caseApplicants = await Promise.all(
      requestBody.FamilyMemberIds?.map(async familyMemberId => {
        // does this user has this family member?
        const userFamilyMember = await db.userFamilyMember.findFirst({
          where: {
            id: familyMemberId,
            UserId: userId,
            DeletedAt: null,
          },
        });

        if (!userFamilyMember) {
          throw new CustomError(`Family member with id ${familyMemberId}`, 400);
        }

        return {
          UserFamilyMemberId: familyMemberId,
          CaseId: newCase.id,
        };
      }) ?? [],
    );

    if (caseApplicants?.length) {
      await db.caseApplicant.createMany({ data: caseApplicants, skipDuplicates: true });
    }

    const caseTeamAssignment = {
      UserId: userId,
      CaseRole: CASE_OWNER,
      CaseId: newCase.id,
    };

    await db.caseTeamAssignment.create({ data: caseTeamAssignment });

    const overallCase = await db.case.findFirst({
      where: {
        id: newCase.id,
        DeletedAt: null,
      },
      include: {
        CaseApplicants: true,
        CaseTeamAssignments: true,
      },
    });

    await logActivity({
      activityType: 'CREATE_CASE',
      activityValue: `User (${user.Email} - ${user.IdpId}) created a new case.`,
      userId: user.id,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input, case: overallCase }),
      activityRelatedEntityId: newCase.id,
      activityRelatedEntity: 'CASE',
    });

    return overallCase;
  });
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
