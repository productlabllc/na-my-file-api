import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import joi = require('joi');
import { getUserByEmail } from '../../lib/data/get-user-by-idp-id';
import { CognitoJwtType } from '../../lib/types-and-interfaces';
import { GetUserActivitiesResponseSchema } from '../../lib/route-schemas/user.schema';
import { GetUserActivitiesResponse, GetUserActivityQuery } from '../../lib/route-interfaces';
import { getDB } from '../../lib/db';
import { Prisma } from '.prisma/client';
import { CLIENT } from '../../lib/constants';
import { ActivityLogTypesList } from '../../lib/types-and-interfaces';

export const routeSchema: RouteSchema = {
  query: {
    activityTypes: joi.string(),
    from: joi.date(),
    to: joi.date().default(new Date()),
    page: joi.number().min(1).default(1),
    pageSize: joi.number().min(10).default(50),
  },
  responseBody: GetUserActivitiesResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  try {
    const jwt: CognitoJwtType = input.routeData.jwt;

    const user = await getUserByEmail(jwt?.email);
    const query: GetUserActivityQuery = input.query;

    const db = getDB();
    let whereClause: Prisma.PlatformActivityLogWhereInput = {
      CreatedAt: {
        gte: query.from! || user.CreatedAt,
        lte: query.to || new Date(),
      },
      OR: [
        { ActivityGeneratedByUserId: user.id },
        {
          Case: {
            CaseTeamAssignments: {
              some: {
                UserId: user.id,
                CaseRole: CLIENT,
              },
            },
          },
        },
      ],
      ActivityType: {
        in: query?.activityTypes ? query?.activityTypes.split(',') : ActivityLogTypesList,
      },
    };

    const data = await db.platformActivityLog.findMany({
      where: whereClause,
      orderBy: {
        CreatedAt: 'desc',
      },
      skip: (query.page! - 1) * query.pageSize!,
      take: query.pageSize,
      include: {
        User: true,
        Case: true,
      },
    });
    const count = await db.platformActivityLog.count({
      where: whereClause,
    });

    const retVal: GetUserActivitiesResponse = {
      currentPage: query.page,
      pageSize: query.pageSize,
      total: count,
      totalPages: Math.ceil(count / query.pageSize!),
      items: data as GetUserActivitiesResponse['items'],
    };
    return retVal;
  } catch (e) {
    throw new CustomError(JSON.stringify({ message: 'Error while getting user activity', e }), 500);
  }
};

const routeModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
