import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import Joi = require('joi');
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { GetUserActivityResponseSchema } from '../../lib/route-schemas/user.schema';
import { GetUserActivityQuery } from '../../lib/route-interfaces';
import { getDB } from '../../lib/db';

export const routeSchema: RouteSchema = {
  query: {
    filters: Joi.object({
      fromDate: Joi.date().required(),
      toDate: Joi.date().required(),
    }).required(),
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(10).required(),
  },
  responseBody: GetUserActivityResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const jwt: NycIdJwtType = input.routeData.jwt;

    const user = await getUserByEmail(jwt?.email);
    const query: GetUserActivityQuery = input.query;

    const db = getDB();

    const data = await db.platformActivityLog.findMany({
      where: {
        ActivityGeneratedByUserId: user?.id,
        AND: {
          CreatedAt: {
            gte: query.filters?.fromDate,
            lte: query.filters?.toDate,
          },
        },
      },
      orderBy: {
        CreatedAt: 'desc',
      },
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
      take: query.limit ?? 10,
    });

    return {
      data,
      count: data.length,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
      limit: query.limit ?? 10,
    };
  } catch (e) {
    throw new CustomError('Error while getting user activity', 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
