import { SQSEvent } from 'aws-lambda';
import { getDB } from '../lib/db';
import { ActivityLogMessageType } from '../lib/types-and-interfaces';

export const handler = async (event: SQSEvent, context: any) => {
  const db = getDB();
  console.log('event', event);
  console.log('context', context);
  const {
    Records: [msg],
  } = event;
  if (msg) {
    const activity = JSON.parse(msg.body) as ActivityLogMessageType;
    let loggedActivity = null;
    const activityData = JSON.parse(activity.activityValue);
    // make sure user exists

    const activityUser = await db.user.findFirst({
      where: {
        id: activity.userId,
      },
    });

    if (!activityUser) {
      throw JSON.stringify({
        message: 'User for this activity does not exists',
        userId: activity.userId,
      });
    }
    const potentialCaseId = activityData?.case?.id ?? activity.activityRelatedEntityId;
    if (activity.activityCategory === 'case') {
      loggedActivity = await db.caseActivityLog.create({
        data: {
          CaseId: potentialCaseId,
          ActivityGeneratedByUserId: activity.userId,
          ActivityType: activity.activityType,
          ActivityValue: activity.activityValue,
          Metadata: activity.metadataJson,
          ...(activity.caseFilIds?.length
            ? {
                ActivitiesCaseFiles: {
                  create: activity.caseFilIds.map(cf => ({ CaseFileId: cf })),
                },
              }
            : {}),
          ...(activity.familyMemberIds?.length
            ? {
                FamilyMemberCaseActivityLogs: {
                  create: activity.familyMemberIds.map(fmi => ({ UserFamilyMemberId: fmi })),
                },
              }
            : {}),
        },
      });

      console.log('case activity');
      console.log(loggedActivity);
    }

    loggedActivity = await db.platformActivityLog.create({
      data: {
        ActivityType: activity.activityType,
        ActivityValue: activity.activityValue,
        ActivityGeneratedByUserId: activity.userId,
        CreatedAt: new Date(),
        CaseId: activity.activityCategory === 'case' ? potentialCaseId : null,
        LastModifiedAt: new Date(),
        Metadata: activity.metadataJson,
        RelatedId: activity.activityRelatedEntityId,
        RelatedEntity: activity.activityRelatedEntity,
      },
    });

    console.log('platform activity: ');
    console.log(loggedActivity);
  }
};
