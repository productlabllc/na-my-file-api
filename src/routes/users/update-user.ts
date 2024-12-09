import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import Joi = require('joi');
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { UpdateUserRequest } from '../../lib/route-interfaces';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { UpdateUserRequestSchema, UpdateUserResponseSchema } from '../../lib/route-schemas/user.schema';

import { CAN_EDIT_PROFILE } from '../../lib/constants';
import { logActivity } from '../../lib/sqs';

const routeSchema: RouteSchema = {
  requestBody: UpdateUserRequestSchema,
  responseBody: UpdateUserResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: UpdateUserRequest = { ...input.body };

  const jwt: CognitoJwtType = input.routeData.jwt;

  const user = await getUserByEmail(jwt?.email);

  // get valid fields in request body
  const updateKeys = Object.keys(requestBody) as Array<keyof typeof requestBody>;
  const updateFields = updateKeys.reduce((acc, key) => {
    if (requestBody[key] == undefined && requestBody[key] == null) {
      delete acc[key];
    }
    return acc;
  }, requestBody);

  const userRoles = (
    await db.user_StakeholderGroupRole.findMany({
      where: {
        UserId: user.id,
      },
      include: {
        StakeholderGroupRole: true,
      },
    })
  ).map(role => role.StakeholderGroupRole?.Name);

  // const canEditProfile = userRoles.some(role => CAN_EDIT_PROFILE.includes(role as (typeof CAN_EDIT_PROFILE)[number]));

  // if (!canEditProfile) {
  //   throw new CustomError(
  //     JSON.stringify({
  //       message: 'User does not have permissions to update their profile',
  //     }),
  //     400,
  //   );
  // }

  const currentUserData = await db.user.findUnique({
    where: {
      id: user?.id,
    },
  });

  const updatedUser = await db.user.update({
    where: {
      id: user?.id,
    },
    data: {
      ...updateFields,
    },
    select: {
      id: true,
      FirstName: true,
      LastName: true,
      Email: true,
      DOB: true,
      LanguageIsoCode: true,
      TOSAcceptedAt: true,
      PPAcceptedAt: true,
      CreatedAt: true,
      LastModifiedAt: true,
    },
  });

  await logActivity({
    activityType: 'CLIENT_UPDATE_PROFILE_SELF',
    activityValue: JSON.stringify({ value: updatedUser, oldValue: currentUserData }),
    userId: user.id,
    timestamp: new Date(),
    metadataJson: JSON.stringify({ request: input }),
    activityRelatedEntityId: user?.id,
    activityRelatedEntity: 'CASE_FILE',
  });

  return updatedUser;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
