import { SQSEvent } from 'aws-lambda';
import { deleteQueueMessage } from '../lib/sqs';
import { NotificationPayload, saveProcessedNotifications } from '../lib/email-activity-manager';

export const handler = async (event: SQSEvent, context: any) => {
  const {
    Records: [msg],
  } = event;
  console.log(event);
  if (msg) {
    console.log(msg);
    const notificationpayload = JSON.parse(msg.body) as NotificationPayload;
    await saveProcessedNotifications(notificationpayload);
    await deleteQueueMessage(process.env.POST_SEND_EMAIL_CLEANUP_QUEUE_URL!, msg);
  }
};
