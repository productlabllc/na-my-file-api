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
import { UpdateFamilyMemberRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import {
  UpdateFamilyMemberRequestSchema,
  UpdateFamilyMemberResponseSchema,
} from '../../lib/route-schemas/family-member.schema';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  requestBody: UpdateFamilyMemberRequestSchema,
  responseBody: UpdateFamilyMemberResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: UpdateFamilyMemberRequest = input.body;

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  const userId = user?.id;

  const dataUpdateKeys = Object.keys(requestBody) as Array<keyof UpdateFamilyMemberRequest>;
  dataUpdateKeys.forEach(key => {
    if (requestBody[key] === undefined || requestBody[key] === null) {
      delete requestBody[key];
    }
  });

  const newData = { ...requestBody } as Partial<typeof requestBody>;
  delete newData.id;

  const existingValue = await db.userFamilyMember.findFirst({ where: { id: requestBody.id } });

  const updatedUser = await db.userFamilyMember.update({
    data: newData,
    where: {
      id: requestBody.id,
      AND: {
        UserId: userId,
      },
    },
    select: {
      id: true,
      User: true,
      FirstName: true,
      LastName: true,
      UserFiles: true,
      Relationship: true,
      CaseApplicants: true,
      DOB: true,
      LastModifiedAt: true,
    },
  });

  await logActivity({
    activityType: 'CLIENT_UPDATE_FAMILY_MEMBER',
    activityValue: JSON.stringify({ oldValue: existingValue, newValue: updatedUser }),
    userId: user!.id,
    timestamp: new Date(),
    familyMemberIds: [updatedUser.id],
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: requestBody.id,
    activityRelatedEntity: 'FAMILY_MEMBER',
  });

  return updatedUser;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
