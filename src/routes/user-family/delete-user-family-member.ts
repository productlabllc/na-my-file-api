import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { DeleteFamilyMemberRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import {
  DeleteFamilyMemberRequestSchema,
  DeleteFamilymemberResponseSchema,
} from '../../lib/route-schemas/family-member.schema';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  requestBody: DeleteFamilyMemberRequestSchema,
  responseBody: DeleteFamilymemberResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: DeleteFamilyMemberRequest = input.body;

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user.id;

  // This action deletes a user member and remove them from created cases.
  try {
    const existingFamilyMembers = await db.userFamilyMember.findMany({
      where: {
        id: {
          in: requestBody,
        },
      },
      include: {
        CaseApplicants: true,
      },
    });
    // We use a transaction because we want to perform each individual deletes
    // and check that family member being deleted actually belongs to the user.
    const response = await db.$transaction(async tx => {
      const proResponse = await Promise.all(
        requestBody.map(async familyMemberId => {
          await tx.userFamilyMember.softDelete({
            where: {
              UserId: userId,
              id: familyMemberId,
            },
          });

          // Delete the associated case applicants
          await tx.caseApplicant.softDeleteMany({
            where: {
              UserFamilyMemberId: familyMemberId,
            },
          });
        }),
      );
      return proResponse;
    });

    await logActivity({
      activityType: 'CLIENT_DELETE_FAMILY_MEMBERS',
      activityValue: JSON.stringify({
        oldValue: existingFamilyMembers,
        description: 'contains family members and their deleted applications',
      }),
      familyMemberIds: existingFamilyMembers.map(fm => fm.id),
      userId: user.id,
      activityRelatedEntity: 'FAMILY_MEMBER',
      timestamp: new Date(),
      metadataJson: JSON.stringify({ request: input }),
    });

    return response;
  } catch (error) {
    console.error('delete error: ', error);
    throw new CustomError(JSON.stringify('Unable to perform delete'), 500);
  }
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
