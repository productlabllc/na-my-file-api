import { SQSEvent } from 'aws-lambda';
import { NotificationPayload, saveProcessedNotifications } from '../../lib/email-activity-manager';
import { sendEmail } from './emailSender';
import { deleteQueueMessage, sendMessageToQueue } from '../../lib/sqs';

export const handler = async (event: SQSEvent, context: any) => {
  const {
    Records: [msg],
  } = event;
  console.log(event);
  if (msg) {
    console.log(msg);
    const { payload: sendEmailRequests } = JSON.parse(msg.body) as { payload: NotificationPayload[] };
    console.warn('sending emails : ');
    console.log(sendEmailRequests);
    const { EMAIL_ADDRESS_FILTER } = process.env;
    for (let i = 0; i < sendEmailRequests.length; i++) {
      if (
        !EMAIL_ADDRESS_FILTER ||
        sendEmailRequests[i].data.destination.ToAddresses!.map(a => a.toLowerCase()).includes(EMAIL_ADDRESS_FILTER)
      ) {
        await sendEmail(sendEmailRequests[i].data);
      }
      await sendMessageToQueue(
        process.env.POST_SEND_EMAIL_CLEANUP_QUEUE_URL!,
        sendEmailRequests[i],
        sendEmailRequests[i].notificationId,
      );
    }
    await deleteQueueMessage(process.env.SEND_EMAIL_QUEUE_URL!, msg);
  }
};
