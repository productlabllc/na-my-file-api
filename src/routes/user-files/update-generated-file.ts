import {
  CustomError,
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { UpdateGeneratedFileRequest } from '../../lib/route-interfaces';
import { getDB } from '../../lib/db';

import {
  UpdateGeneratedFileRequestSchema,
  UpdateGeneratedFileResponseSchema,
} from '../../lib/route-schemas/user-file.schema';

export const routeSchema: RouteSchema = {
  requestBody: UpdateGeneratedFileRequestSchema,
  responseBody: UpdateGeneratedFileResponseSchema,
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const body: UpdateGeneratedFileRequest = input.body;

  try {
    const db = getDB();

    // update generated user file
    const generatedFile = await db.generatedFile.update({
      where: {
        id: body.id,
      },
      data: {
        ...(body.Title ? { Title: body.Title } : {}),
        ...(body.Status ? { Status: body.Status } : {}),
        ...(body.SizeInBytes ? { SizeInBytes: body.SizeInBytes } : {}),
        ...(body.Description ? { Description: body.Description } : {}),
        ...(body.FileType ? { FileType: body.FileType } : {}),
        ...(body.ContentType ? { ContentType: body.ContentType } : {}),
        ...(body.OriginalFilename ? { OriginalFilename: body.OriginalFilename } : {}),
      },
      select: {
        id: true,
        SizeInBytes: true,
        Status: true,
        CreatedAt: true,
        LastModifiedAt: true,
        OriginalFilename: true,
      },
    });

    return generatedFile;
  } catch (error: any) {
    throw new CustomError(error._message || JSON.stringify(error), error._httpStatusCode || 500);
  }
};

const routeModule = {
  routeChain: [schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
