import { APIGatewayProxyEventV2, SQSEvent } from "aws-lambda"
import { getDB } from "../lib/db"
import { ActivityLogMessageType } from "../lib/types-and-interfaces";

export const handler = async (event: SQSEvent, context: any) => {
  const db = getDB();
  console.log('event', event);
  console.log('context', context);
  const { Records: [msg] } = event;
  if (msg) {
    const activity = JSON.parse(msg.body) as ActivityLogMessageType;
    const user = await db.user.findFirst({
      where: {
        IdpId: activity.userId,
      },
    });
    const loggedActivity = await db.platformActivityLog.create({
      data: {
        ActivityType: activity.activityType,
        ActivityValue: activity.activityValue,
        ActivityGeneratedByUserId: user?.id,
        CreatedAt: new Date(),
        LastModifiedAt: new Date(),
        Metadata: activity.metadataJson,
        RelatedId: activity.activityRelatedEntityId,        
        RelatedEntity: activity.activityRelatedEntity,
      }
    });
    console.log(`Created Activity Log:
    ${JSON.stringify(loggedActivity)}
    `);
  }
}