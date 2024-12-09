import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { getDB } from '../../lib/db';
import { FamilyMemberSchema } from '../../lib/route-schemas/family-member.schema';
import Joi = require('joi');
import { logActivity } from '../../lib/sqs';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';

const routeSchema: RouteSchema = {
  params: {
    id: Joi.string().required(),
  },
  responseBody: FamilyMemberSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const id = input.params.id as string;
  const jwt: CognitoJwtType = input.routeData.jwt;
  const user = await getUserByEmail(jwt?.email);

  const data = await db.userFamilyMember.findFirst({
    where: {
      id,
      DeletedAt: null,
    },
  });

  await logActivity({
    activityType: 'CLIENT_GET_FAMILY_MEMBER_BY_ID',
    activityValue: JSON.stringify({ value: data }),
    userId: user.id,
    familyMemberIds: data?.id ? [data?.id] : [],
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: id,
    activityRelatedEntity: 'FAMILY_MEMBER',
  });

  return data;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
