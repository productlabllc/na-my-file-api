import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { FamilyMemberSchema } from '../../lib/route-schemas/family-member.schema';
import Joi = require('joi');
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  responseBody: Joi.array().items(FamilyMemberSchema),
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const jwt: NycIdJwtType = input.routeData.jwt;
  const user = await getUserByEmail(jwt?.email);

  const userId = user.id;

  const data = await db.userFamilyMember.findMany({
    where: {
      UserId: userId,
      DeletedAt: null,
    },
  });

  await logActivity({
    activityType: 'GET_ALL_USER_FAMILY_MEMBERS',
    activityValue: `User (${user.Email} - ${user.IdpId}) retrieved all family member.`,
    userId: user.id,
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
