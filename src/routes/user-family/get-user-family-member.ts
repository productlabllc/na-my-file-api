import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getDB } from '../../lib/db';
import { UserFamilySchema } from '../../lib/route-schemas/user-family.schema';
import * as Joi from 'joi';

export const routeSchema: RouteSchema = {
  params: {
    id: Joi.string().required(),
  },
  responseBody: UserFamilySchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const id = input.params.id as string;

  const data = await db.userFamilyMember.findFirst({
    where: {
      id,
      DeletedAt: null,
    },
  });

  return data;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
