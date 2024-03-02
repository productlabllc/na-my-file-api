import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteModule,
  RouteSchema,
  jwtValidationMiddleware,
  schemaValidationMiddleware,
} from '@myfile/core-sdk';
import { getUserByIdpId } from '../../lib/data/get-user-by-idp-id';
import { CreateUserRequest } from '../../lib/route-interfaces';
import { NycIdJwtType } from '@myfile/core-sdk/dist/lib/types-and-interfaces';
import { getDB } from '../../lib/db';
import { CreateUserRequestSchema, CreateUserResponseSchema } from '../../lib/route-schemas/user.schema';

export const routeSchema: RouteSchema = {
  requestBody: CreateUserRequestSchema,
  responseBody: CreateUserResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const db = getDB();

  const requestBody: CreateUserRequest = input.body;

  const jwt: NycIdJwtType = input.routeData.jwt;

  const user = await getUserByIdpId(jwt?.GUID);

  const userId = user?.id;

  if (userId) {
    throw new CustomError('User already exists', 409);
  }

  const newUser = await db.$transaction(async tx => {
    // Make sure language exists
    const language = await tx.language.findUnique({
      where: {
        id: requestBody.LanguageId,
      },
    });

    if (!language) {
      throw new CustomError(
        JSON.stringify({
          message: `Language ${requestBody.LanguageId} not found`,
        }),
        400,
      );
    }

    const user = await tx.user.create({
      data: {
        FirstName: requestBody.FirstName,
        LastName: requestBody.LastName,
        Email: requestBody.Email,
        DOB: requestBody.DOB,
        LanguageId: requestBody.LanguageId,
        IdpId: jwt?.GUID,
      },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        Email: true,
        CreatedAt: true,
        DOB: true,
        TOSAcceptedAt: true,
        PPAcceptedAt: true,
      },
    });

    const workflowData = await Promise.all(
      requestBody.Workflows?.map(async workflow => {
        const thisWorkflow = await tx.workflow.findUnique({
          where: {
            id: workflow,
          },
        });

        if (!thisWorkflow) {
          throw new CustomError(
            JSON.stringify({
              message: `Workflow ${workflow} not found`,
            }),
            400,
          );
        }

        return {
          WorkflowId: workflow,
          UserId: user.id,
        };
      }) || [],
    );

    const workflows = await tx.userWorkflow.createMany({
      data: workflowData,
      skipDuplicates: true,
    });

    return {
      ...user,
      WorkFlows: workflows,
    };
  });

  return newUser;
};

const routeModule: RouteModule = {
  routeChain: [jwtValidationMiddleware, schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
