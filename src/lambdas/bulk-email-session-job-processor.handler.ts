import { getDB } from '../lib/db';
import { send30MinsEmailsNotifs, sendDailyNotifs } from '../lib/email-activity-manager';

export const handler = async (event: any) => {
  const db = getDB();
  console.log('event', event);

  /* 
    - this handler will get invoked at the interval specified by the EventBridge Rule (i.e. 30 minutes in production, 3 minutes in development/testing)


    IMPORTANT:
    - Test this with 3-minute (for 30-minute session) and any multiple of 3 for daily session (i.e. 6, 9, 12, 15) while developing
    - This means that the Rule will use a 3-minute interval during development
  */

  await send30MinsEmailsNotifs();

  await sendDailyNotifs();
};

/*
- Email notification types are pre-defined as "immediate" or "bulk (session)"
- Bulk email notifications are pre-defined as to the range of time in which they collection notifications before being sent
- For this discussion, let's say we have 2 Bulk email notification types:
  * 30-minute session
  * Beginning of workday (M-F @ 9am Eastern US Time)

In the above 2 bulk session types, we can use the smallest increment of time for an Event Bridge:
- Setup a 30-minute EventBridget Scheduled Task --> triggers new Lambda handler (BulkNotificationHandlerLambda)
- Setup a table to capture job details of processing each session
- Setup a table to capture notifications for bulk

create table BulkNotificationJob
{
  id guid;
  NotificationSessionType text (enum of TS recognized types -- 30m, WorkdayMorning, etc)
  NotificationRecipientType text (enum of TS recognized types -- CLIENT, DHS_STAFF, HPD_STAFF, DHS_STAFF, DHS_ADMIN_STAFF, PATH_STAFF)
  SessionStart dateTime
  SessionEnd dateTime
  ClientUserId? guid

}

create table BulkNotifications 
{
  id guid;
  NotificationSessionType text (enum of TS recognized types -- 30m, WorkdayMorning, etc)
  NotificationRecipientType text (enum of TS recognized types -- CLIENT, DHS_STAFF, HPD_STAFF, DHS_STAFF, DHS_ADMIN_STAFF, PATH_STAFF)
  CaseId? guid nullable
  OriginatorUserId guid
  NotificationCreatedAt dateTime
  NotificationMetadata json/text (if needed)
  ... other fields here if needed ...
}



THIS HAPPENS EVERY TIME:
    - const now = Date.now();
    - const messagesForBulkNotification = "select * from BulkNotifications where NotificationType = '30m' and CreatedAt <= ${now}"
    - create payload for email generation
    - send EmailRequest SQS message
    - EmailRequestHandlerLambda handles email generation for this bulk message
    - delete from BulkNotifications where NotificationType = '30m' and CreatedAt <= ${now}

THIS HAPPENS ONLY IF THE CONDITION IS TRUE
    - const sessionBeginDateTime = new Date(--9am yesterday--);

    if (date.now() >= new Date(--9am eastern time today--)) {
    - const now = Date.now();
    - const messagesForBulkNotification = "select * from BulkNotifications where NotificationType = 'WeekdayMorning' and CreatedAt <= ${now} and CreatedAt <= ${sessionBeginDateTime} 
                                            GROUP BY 
                                              STAKEHOLDER_ROLE_TYPE

                                              "

    - create payload for email generation
    - send email request to Queue with this template
  EXAMPLE PLAIN TEXT TEMPLATE (Send SQS message to EmailProcessingQueue for each Agency user for the NotificationRecipientType):
  ------------------------------------------------------------------------------------------------------------------------------
      Hi {givenName},

      Here is your daily digest of activity from My File NYC:

      {foreach client of activeClientsWithActivity}
        Client: {client.givenName} {client.familyName}

        {foreach activity of client.activities}
          {activity}
        {/foreach}

      {/foreach}



    SendEmailRequestHandlerLambda:
    - SendEmailRequestHandlerLambda handles email generation for this bulk message
    - SendEmailRequestHandlerLambda should delete from BulkNotifications where NotificationType = 'WeekdayMorning' and CreatedAt <= ${now} and CreatedAt <= ${sessionBeginDateTime}
    }
*/
