import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { ActivityLogMessageType } from "./types-and-interfaces";

export const sendMessageToQueue = async (queueUrl: string, messageBody: any) => {
  const client = new SQSClient({});
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody),
  });
  const response = await client.send(command);
  return response;
};

export const logActivity = async (msgPayload: ActivityLogMessageType) => {
  const {
    SQS_ACTIVITY_LOG_QUEUE_URL = '',
  } = process.env;
  return sendMessageToQueue(SQS_ACTIVITY_LOG_QUEUE_URL, msgPayload);
}