import { DeleteMessageCommand, SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ActivityLogMessageType } from './types-and-interfaces';
import { SQSEvent } from 'aws-lambda';
import {
  NotificationPayload,
  registerBulkEmailNotification,
  sendImmediateEmailNotifications,
} from './email-activity-manager';

export const sendMessageToQueue = async (queueUrl: string, messageBody: any, groupId?: string) => {
  const client = new SQSClient({});
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({ ...messageBody, currentTime: new Date().getTime() }),

    ...(groupId ? { MessageGroupId: groupId } : {}),
  });
  const response = await client.send(command);
  return response;
};

export const logActivity = async ({ activityCategory = 'platform', ...msgPayload }: ActivityLogMessageType) => {
  const { SQS_ACTIVITY_LOG_QUEUE_URL = '' } = process.env;
  const payload = { ...msgPayload, activityCategory };
  console.log(payload);

  console.warn('sending sqs vent: ', SQS_ACTIVITY_LOG_QUEUE_URL);
  const sqsResp = await sendMessageToQueue(SQS_ACTIVITY_LOG_QUEUE_URL, payload);

  console.warn('send sqs event: ', sqsResp);

  await registerBulkEmailNotification(payload);

  await sendImmediateEmailNotifications(payload);

  return sqsResp;
};

export const triggerPdfGeneration = async (generatedFileId: string) => {
  const { DOCUMENT_GENERATOR_QUEUE_URL = '' } = process.env;
  await sendMessageToQueue(DOCUMENT_GENERATOR_QUEUE_URL, { generatedFileId }, generatedFileId);
};

export const triggerCaseCriterionCalculation = async (payload: { caseId: string; caseCriterionId?: string }) => {
  const { CASE_CRITERION_CALC_QUEUE_URL = '' } = process.env;
  await sendMessageToQueue(CASE_CRITERION_CALC_QUEUE_URL, payload, `${payload.caseId}-${payload.caseCriterionId}`);
};

export const requestSendEmail = async (payload: NotificationPayload[]) => {
  const { SEND_EMAIL_QUEUE_URL = '' } = process.env;
  if (payload.length) {
    await sendMessageToQueue(SEND_EMAIL_QUEUE_URL, { payload }, payload[0].notificationId);
  }
};

export const deleteQueueMessage = async (queueUrl: string, record: SQSEvent['Records'][0]) => {
  const client = new SQSClient({});
  const command = new DeleteMessageCommand({
    QueueUrl: queueUrl,
    ReceiptHandle: record.receiptHandle,
  });
  const response = await client.send(command);
  return response;
};
