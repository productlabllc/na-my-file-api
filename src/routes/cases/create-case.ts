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
import { CASE_CRITERION_FULFILLMENT_STATUS, CLIENT, CASE_STATUS, WORKFLOW_USER_ROLES } from '../../lib/constants';
import { CaseCriterion } from '@prisma/client';
import { logActivity } from '../../lib/sqs';
import { ActivityLogMessageType } from '../../lib/types-and-interfaces';

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

  /**
   * Check if the user has an opened case of the type of the new case
   */

  const userCase = await db.case.findFirst({
    where: {
      CaseType: requestBody.CaseType,
      Status: CASE_STATUS.OPEN,
      DeletedAt: null,
      CaseTeamAssignments: {
        some: {
          UserId: user.id,
          CaseRole: CLIENT,
        },
      },
    },
  });

  if (userCase) {
    throw new CustomError(
      JSON.stringify({
        message: `User already has an opened case of type : ${requestBody.CaseType}`,
      }),
      409,
    );
  }

  return await db.$transaction(async db => {
    const caseTitle = requestBody.CaseTitle ?? `${user.LastName}, ${user.FirstName}  ${requestBody.CaseType}`;

    const newCase = await db.case.create({
      data: {
        CaseType: requestBody.CaseType,
        Title: caseTitle,
        CaseAttributes: requestBody.CaseAttributes,
        SSN: requestBody.SSN,
        AgencyCaseIdentifier: requestBody.CaseIdentifier,
        Status: CASE_STATUS.OPEN,
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
        WorkFlow: true,
        id: true,
      },
    });

    const workflowType = workflowStages[0].WorkFlow?.Type as keyof typeof WORKFLOW_USER_ROLES;

    const workflowUsers = (
      await db.stakeholderGroupRole.findMany({
        where: {
          Name: {
            in: WORKFLOW_USER_ROLES[workflowType],
          },
        },
        include: {
          User_StakeholderGroupRole: {
            include: {
              User: true,
            },
          },
        },
      })
    ).flatMap(ele => ele.User_StakeholderGroupRole.map(e => ({ ...e.User, Role: ele.Name })));

    const caseCriteria = workflowStages.reduce(
      (acc, workflowStage) => {
        return [
          ...acc,
          ...workflowStage.WorkflowStageCriteria.map((workStageCriterion, index) => {
            return {
              CaseId: newCase.id,
              CriterionFulfillmentStatus: CASE_CRITERION_FULFILLMENT_STATUS.PENDING,
              Name: workStageCriterion.Name,
              CriterionSubGroupName: workStageCriterion.CriterionSubGroupName,
              CriterionGroupName: workStageCriterion.CriterionGroupName,
              CriterionFulfillmentType: workStageCriterion.CriterionFulfillmentType,
              RuleSets: workStageCriterion.RuleSets,
              WorkflowStageCriterionId: workStageCriterion.id,
              LastModifiedByUserId: user.id,
            };
          }),
        ];
      },
      [] as Array<
        Pick<
          CaseCriterion,
          | 'CaseId'
          | 'WorkflowStageCriterionId'
          | 'LastModifiedByUserId'
          | 'CriterionFulfillmentStatus'
          | 'CriterionFulfillmentType'
        >
      >,
    );

    await db.caseCriterion.createMany({
      data: caseCriteria.map((criterion, index) => ({
        ...criterion,
        // Used to maintain correct sorting order in the front end.
        Index: `${index + 1}`,
      })),
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
          throw new CustomError(JSON.stringify({ message: `Family member with id ${familyMemberId} not found.` }), 400);
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

    const caseTeamAssignment = [
      {
        UserId: userId,
        CaseRole: CLIENT,
        CaseId: newCase.id,
      },
      ...workflowUsers.map(ele => ({
        UserId: ele?.id,
        CaseId: newCase.id,
        CaseRole: ele.Role,
      })),
    ];

    await db.caseTeamAssignment.createMany({ data: caseTeamAssignment });

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

    const activityData: ActivityLogMessageType = {
      activityType: 'CLIENT_CREATE_CASE',
      activityValue: JSON.stringify({ case: overallCase }),
      userId: user.id,
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input, case: overallCase }),
      activityRelatedEntityId: newCase.id,
      activityRelatedEntity: 'CASE',
    };

    await logActivity({ ...activityData, activityCategory: 'case' });

    return overallCase;
  });
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
