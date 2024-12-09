import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { FamilyMemberSchema } from '../../lib/route-schemas/family-member.schema';
import Joi = require('joi');
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  responseBody: Joi.array().items(FamilyMemberSchema),
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: CognitoJwtType = input.routeData.jwt;
  const user = await getUserByEmail(jwt?.email);

  const userId = user.id;

  const data = await db.userFamilyMember.findMany({
    where: {
      UserId: userId,
      DeletedAt: null,
    },
  });

  await logActivity({
    activityType: 'CLIENT_GET_ALL_USER_FAMILY_MEMBERS',
    activityValue: JSON.stringify({ value: data }),
    userId: user.id,
    familyMemberIds: data.map(fm => fm.id),
    activityRelatedEntity: 'FAMILY_MEMBER',
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
  });

  return data;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
