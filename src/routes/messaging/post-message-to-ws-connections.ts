import {
  MiddlewareArgumentsInputFunction,
  RouteArguments,
  RouteSchema,
  schemaValidationMiddleware,
} from 'aws-lambda-api-tools';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import joi = require('joi');
import postMessageToConnection from '../../lib/post-message-to-connection';

export const routeSchema: RouteSchema = {
  params: {
    userId: joi.string().uuid({ version: 'uuidv4' }),
  },
};

type PostBody = {
  connectionsBaseUrl: string;
  connectionIds: Array<string>;
  connectionIdScope: string;
  message: {
    type: string;
    payload: object | string;
  };
  region: string;
  origin: string;
};

export const handler: MiddlewareArgumentsInputFunction = async (input: RouteArguments) => {
  const { connectionIds, connectionIdScope, message, origin } = input.body as PostBody;
  let result = {};
  try {
    const client = new SQSClient({});
    const command = new SendMessageCommand({
      QueueUrl: process.env.SQS_BROADCAST_MSG_QUEUE_URL!,
      MessageBody: JSON.stringify({ connectionIds, connectionIdScope, message, origin }),
    });
    const response = await client.send(command);
    result = {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    result = { statusCode: 500, body: JSON.stringify(error) };
  }
  return result;
};

const routeModule = {
  routeChain: [schemaValidationMiddleware(routeSchema), handler],
  routeSchema,
};

export default routeModule;
