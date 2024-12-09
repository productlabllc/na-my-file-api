import { STAKEHOLDER_GROUP_ROLES } from './constants';
import { getDB } from './db';
import { DateTime } from 'luxon';
import { ActivityLogEnum, ActivityLogMessageType, ActivityLogType } from './types-and-interfaces';
import { Destination } from '@aws-sdk/client-ses';
import { CustomError } from 'aws-lambda-api-tools';
import { requestSendEmail } from './sqs';
import { GeneratedFile, User, UserFamilyMember } from '@prisma/client';

/**
 * Email Activities configuration
 */
export enum EmailNotificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
}

type UserGroup = keyof typeof NOTIFIABLE_ACTIVITIES;

enum ActivityIcons {
  PlusIcon = 'plus-file.svg',
  Reload = 'reload.svg',
  CheckMark = 'check-mark.svg',
  Reject = 'reject.svg',
}
/**
 *  > Client Classifications
 */
export const BULK_NOTIFIABLE_ACTIVITIES_CLIENT = [
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_SELF,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_UPLOAD_DOCUMENT_CLIENT,
  ActivityLogEnum.AGENT_UPLOAD_DOCUMENT_FAMILY_MEMBER,
];

export const SINGLE_NOTIFIABLE_ACTIVITIES_CLIENT = [
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_CLOSE_CASE,
  ActivityLogEnum.AGENT_ACTIVATE_CASE,
];

/**
 *  > DHS Classification
 */
export const BULK_NOTIFIABLE_ACTIVITIES_DHS_AGENT = [
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_CLOSE_CASE,
];

export const SINGLE_NOTIFIABLE_ACTIVITIES_DHS_AGENT: ActivityLogEnum[] = [];

/**
 * > Marketing Agents
 */

export const BULK_NOTIFIABLE_ACTIVITIES_MARKETING_AGENTS = [
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_CLOSE_CASE,
];

export const SINGLE_NOTIFIABLE_ACTIVITIES_MARKETING_AGENTS: ActivityLogEnum[] = [];

/**
 *  > DHS ADMIN
 */
export const BULK_NOTIFIABLE_ACTIVITIES_DHS_ADMIN = [
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_CLOSE_CASE,
];

export const SINGLE_NOTIFIABLE_ACTIVITIES_DHS_ADMIN: ActivityLogEnum[] = [];

/**
 * > HPD Agent
 */

export const BULK_NOTIFIABLE_ACTIVITIES_HPD_AGENT = [
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_CLOSE_CASE,
];

export const SINGLE_NOTIFIABLE_ACTIVITIES_HPD_AGENT: ActivityLogEnum[] = [];

/**
 * > PATH Agents
 */

export const BULK_NOTIFIABLE_ACTIVITIES_PATH_AGENT = [
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_CLOSE_CASE,
];

export const SINGLE_NOTIFIABLE_ACTIVITIES_PATH_AGENT: ActivityLogEnum[] = [];

/**
 * User Stakeholder groups to notifiable activities
 */
export const NOTIFIABLE_ACTIVITIES = {
  [STAKEHOLDER_GROUP_ROLES.CLIENT]: {
    BULK: BULK_NOTIFIABLE_ACTIVITIES_CLIENT,
    SINGLE: SINGLE_NOTIFIABLE_ACTIVITIES_CLIENT,
  },
  [STAKEHOLDER_GROUP_ROLES.DHS_AGENT]: {
    BULK: BULK_NOTIFIABLE_ACTIVITIES_DHS_AGENT,
    SINGLE: SINGLE_NOTIFIABLE_ACTIVITIES_DHS_AGENT,
  },
  [STAKEHOLDER_GROUP_ROLES.SPONSOR]: {
    BULK: BULK_NOTIFIABLE_ACTIVITIES_MARKETING_AGENTS,
    SINGLE: SINGLE_NOTIFIABLE_ACTIVITIES_MARKETING_AGENTS,
  },
  [STAKEHOLDER_GROUP_ROLES.CBO_SUPERVISOR]: {
    BULK: BULK_NOTIFIABLE_ACTIVITIES_DHS_ADMIN,
    SINGLE: SINGLE_NOTIFIABLE_ACTIVITIES_DHS_ADMIN,
  },
  [STAKEHOLDER_GROUP_ROLES.HPD_AGENT]: {
    BULK: BULK_NOTIFIABLE_ACTIVITIES_HPD_AGENT,
    SINGLE: SINGLE_NOTIFIABLE_ACTIVITIES_HPD_AGENT,
  },
  [STAKEHOLDER_GROUP_ROLES.PATH_AGENT]: {
    BULK: BULK_NOTIFIABLE_ACTIVITIES_PATH_AGENT,
    SINGLE: SINGLE_NOTIFIABLE_ACTIVITIES_PATH_AGENT,
  },
} as const;

/**
 * Maps activity types to icons for bulk updates
 */
const bulkUpdatesToActivitiesToIconMap = {
  [ActivityLogEnum.CLIENT_ADD_CASE_FILES_FAMILY_MEMBER]: ActivityIcons.PlusIcon,
  [ActivityLogEnum.CLIENT_ADD_CASE_FILES_SELF]: ActivityIcons.PlusIcon,
  [ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_SELF]: ActivityIcons.Reload,
  [ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER]: ActivityIcons.Reload,
  [ActivityLogEnum.AGENT_APPROVE_CASE_FILE_CLIENT]: ActivityIcons.CheckMark,
  [ActivityLogEnum.AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER]: ActivityIcons.CheckMark,
  [ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT]: ActivityIcons.Reject,
  [ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER]: ActivityIcons.Reject,
  [ActivityLogEnum.AGENT_CLOSE_CASE]: ActivityIcons.Reload,
};

export const NOTIFIABLE_CADENCE = {
  DAILY: [
    STAKEHOLDER_GROUP_ROLES.PATH_AGENT,
    STAKEHOLDER_GROUP_ROLES.HPD_AGENT,
    STAKEHOLDER_GROUP_ROLES.CBO_STAFFER,
    STAKEHOLDER_GROUP_ROLES.DHS_AGENT,
  ],
  HALF_HOUR: [STAKEHOLDER_GROUP_ROLES.CLIENT, STAKEHOLDER_GROUP_ROLES.SPONSOR],
  IMMEDIATE: [STAKEHOLDER_GROUP_ROLES.CLIENT],
} as Record<'DAILY' | 'HALF_HOUR' | 'IMMEDIATE', UserGroup[]>;

type Cadence = keyof typeof NOTIFIABLE_CADENCE;

/**
 * Generates a message for a bulk update activity
 */
const getMessageForBulkUpdateActivity = (
  activityType: ActivityLogType,
  activityValue: any,
  originatorUser: User,
  isClient: boolean,
  createdAt: Date,
) => {
  const db = getDB(); // Get database connection

  console.log('getMessageForBulkUpdateActivity -> activityType', activityType);
  console.log('getMessageForBulkUpdateActivity -> activityValue', activityValue);

  const activityData = activityValue; // Activity data from the log
  console.log('getMessageForBulkUpdateActivity -> activityData', activityData);

  const activityUser = originatorUser; // User who initiated the activity
  console.log('getMessageForBulkUpdateActivity -> activityUser', activityUser);

  // Helper function to get client email
  const getClient = () => {
    return activityData.case.CaseTeamAssignments?.[0]?.User?.Email;
  };

  // Helper function to get value key
  const getValueKey = (key: 'newValue' | 'oldValue' | 'value') => {
    if (Array.isArray(activityData[key])) {
      return activityData[key][0];
    } else {
      return activityData[key];
    }
  };

  // Helper function to get family member name
  const getFamilyMember = () => {
    const generatedFile: GeneratedFile & { UserFamilyMember?: UserFamilyMember } =
      getValueKey('newValue').GeneratedFile ??
      getValueKey('oldValue').GeneratedFile ??
      getValueKey('value')?.GeneratedFile;

    const familyMember: UserFamilyMember | undefined = generatedFile?.UserFamilyMember ?? activityData.familyMember;

    return familyMember ? `${familyMember.FirstName} ${familyMember.LastName}` : null;
  };

  // Helper function to get document type
  const getDocumentType = () => {
    const generatedFile: GeneratedFile =
      getValueKey('newValue')?.GeneratedFile ??
      getValueKey('oldValue')?.GeneratedFile ??
      getValueKey('value')?.GeneratedFile ??
      {};
    return generatedFile.FileType;
  };

  // Helper function to get case type
  const getCaseType = () => {
    return activityData?.case?.CaseType;
  };

  const date = DateTime.fromJSDate(createdAt).toFormat('MM/DD/YYYY'); // Format date

  let retVal = '';
  // Generate message based on activity type
  switch (activityType) {
    case ActivityLogEnum.CLIENT_ADD_CASE_FILES_FAMILY_MEMBER:
      retVal = `${activityUser?.Email} added ${getDocumentType()} for ${getFamilyMember()} to their ${getCaseType()} application on ${date}`;
    case ActivityLogEnum.CLIENT_ADD_CASE_FILES_SELF:
      retVal = `${activityUser?.Email} added ${getDocumentType()} to their ${getCaseType()} application on ${date}`;
    case ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER:
      retVal = `${activityUser?.Email} resubmitted ${getDocumentType()} for ${getFamilyMember()} on their ${getCaseType()} application on ${date}`;
    case ActivityLogEnum.CLIENT_REMOVE_CASE_FILES_SELF:
      retVal = `${activityUser?.Email} resubmitted ${getDocumentType()} on their ${getCaseType()} application on ${date}`;
    case ActivityLogEnum.AGENT_APPROVE_CASE_FILE_CLIENT:
      retVal = `${activityUser?.Email} approved ${isClient ? 'your' : `${getClient()}'s`} ${getDocumentType()} on ${isClient ? 'your' : 'their'} ${getCaseType()} application on ${date}`;
    case ActivityLogEnum.AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER:
      retVal = `${activityUser?.Email} approved ${getFamilyMember()}'s ${getDocumentType()} on ${isClient ? 'your' : `${getClient()}'s`} ${getCaseType()} application on ${date}`;
    case ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT:
      retVal = `${activityUser?.Email} rejected ${isClient ? 'your' : `${getClient()}'s`} ${getDocumentType()} on ${isClient ? 'your' : `their`} ${getCaseType()} application on ${date}`;
    case ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER:
      retVal = `${activityUser?.Email} rejected ${getFamilyMember()}'s ${getDocumentType()} on ${isClient ? 'your' : `${getClient()}'s`} ${getCaseType()} application on ${date}`;
    case ActivityLogEnum.AGENT_CLOSE_CASE:
      retVal = `${activityUser?.Email} close ${isClient ? 'your' : `${getClient()}'s`} ${getCaseType()} application on ${date}`;
  }
  console.log('getMessageForBulkUpdateActivity -> retVal', retVal);
  return retVal;
};

/**
 * Registers bulk email notifications for activities
 */
export const registerBulkEmailNotification = async (activityLog: ActivityLogMessageType) => {
  if (activityLog.activityCategory === 'case') {
    const userGroups = Object.keys(NOTIFIABLE_ACTIVITIES) as UserGroup[];

    // Create a set of notifiable activities
    const notifiableActivities = new Set(userGroups.map(group => NOTIFIABLE_ACTIVITIES[group].BULK).flat(3));

    const activityType = activityLog.activityType as ActivityLogEnum;

    if (notifiableActivities.has(activityType)) {
      const db = getDB();

      // Find stakeholders who should be notified
      const notifiableStakeHolders = userGroups.filter(group =>
        NOTIFIABLE_ACTIVITIES[group].BULK.includes(activityType),
      );

      const activityValue = JSON.parse(activityLog.activityValue);
      const caseId = activityValue.case.id;

      // Create email notifications for each stakeholder
      const emailNotifications = notifiableStakeHolders
        .map(stakeHolder => {
          const availableCadences = (Object.keys(NOTIFIABLE_CADENCE) as Cadence[]).filter(cadence =>
            NOTIFIABLE_CADENCE[cadence].includes(stakeHolder),
          );

          const notificationsByCadence = availableCadences.map(cadence => {
            return {
              CaseId: caseId,
              NotificationCadence: cadence,
              NotificationRecipientType: stakeHolder,
              ActivityType: activityLog.activityType,
              OriginatorUserId: activityLog.userId,
              NotificationData: activityValue,
            };
          });

          return notificationsByCadence;
        })
        .flat();

      // Save notifications to the database
      await db.emailNotification.createMany({ data: emailNotifications });
    }
  }
};

interface ImmediateNotification {
  activityType: ActivityLogType;
  recipient: Recipient;
  originator: Originator;
  notificationId: string;
  cadence: 'IMMEDIATE';
  caseType: string;
  activityValue: any;
  userType: string;
  templateId: string;
}

/**
 * Sends immediate email notifications for activities
 */
export const sendImmediateEmailNotifications = async (activityLog: ActivityLogMessageType) => {
  const db = getDB();

  const activityType = activityLog.activityType as ActivityLogEnum;

  // Get user types that should receive immediate notifications
  const immediateNotificationUserTypes = NOTIFIABLE_CADENCE.IMMEDIATE;
  const notifiableActivities = immediateNotificationUserTypes
    .map(userType => NOTIFIABLE_ACTIVITIES[userType].SINGLE)
    .flat(2);
  const canNotify = notifiableActivities.includes(activityType);

  if (canNotify) {
    const activityData = JSON.parse(activityLog.activityValue);

    const thisCase = activityData.case;

    // Find the originator of the activity
    const originator = await db.caseTeamAssignment.findFirst({
      where: {
        DeletedAt: null,
        UserId: activityLog.userId,
        CaseId: thisCase.id,
      },
      include: {
        User: true,
      },
    });

    if (!originator) {
      throw new CustomError(JSON.stringify({ message: 'Notification Originator does not belong to the case' }), 500);
    }

    // Find users who should be notified
    const notifiableUsers = await db.caseTeamAssignment.findMany({
      where: {
        DeletedAt: null,
        CaseId: thisCase.id,
        CaseRole: {
          in: immediateNotificationUserTypes,
        },
      },
      include: {
        User: true,
      },
    });

    // Create immediate notifications for each user
    const immediateNotifications = await db.$transaction(
      notifiableUsers.map(user => {
        return db.emailNotification.create({
          data: {
            OriginatorUserId: originator.UserId,
            CaseId: thisCase.id,
            ActivityType: activityType,
            NotificationCadence: 'IMMEDIATE',
            NotificationRecipientType: user.CaseRole,
            RecipientUserId: user.UserId,
            NotificationData: activityData,
            Status: EmailNotificationStatus.PROCESSED,
          },
        });
      }),
    );

    const notifications: ImmediateNotification[] = [];

    // Prepare notification data for each user
    notifiableUsers.forEach(notifiableUser => {
      const userNotification = immediateNotifications.find(notif => notif.RecipientUserId === notifiableUser.UserId);
      notifications.push({
        caseType: thisCase.CaseType,
        notificationId: userNotification?.id!,
        activityType: activityLog.activityType,
        cadence: 'IMMEDIATE',
        activityValue: activityData,
        userType: notifiableUser.CaseRole!,
        templateId: 'immediate_notification',
        recipient: {
          firstName: notifiableUser.User?.FirstName ?? '',
          id: notifiableUser.User?.id!,
          lastName: notifiableUser.User?.LastName ?? '',
          email: notifiableUser.User?.Email ?? '',
          dob: notifiableUser.User?.DOB ?? '',
        },
        originator: {
          firstName: originator.User?.FirstName ?? '',
          id: originator.User?.id!,
          lastName: originator.User?.LastName ?? '',
          email: originator.User?.Email ?? '',
        },
      });
    });

    // Build email payloads and send emails
    const emailData = notifications.map(buildImmediateNotifEmailPayload);

    await requestSendEmail(emailData);
  }
};

/**
 * Retrieves registered activities for a given cadence
 */
export const getRegisteredActivities = async (cadence: Cadence) => {
  const requiredRecipientTypes = NOTIFIABLE_CADENCE[cadence];

  const db = getDB();

  // Find pending email notifications for the given cadence
  const outStandingRegisteredNotifications = await db.emailNotification.findMany({
    where: {
      DeletedAt: null,
      Status: EmailNotificationStatus.PENDING,
      NotificationCadence: cadence,
      NotificationRecipientType: {
        in: requiredRecipientTypes,
      },
    },
    include: {
      Case: {
        include: {
          CaseTeamAssignments: {
            include: {
              User: {
                include: {
                  StakeholderGroupRoles: {
                    include: {
                      StakeholderGroupRole: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Set email notifications as processed
  await db.emailNotification.updateMany({
    where: {
      id: {
        in: outStandingRegisteredNotifications.map(item => item.id),
      },
    },
    data: {
      Status: EmailNotificationStatus.PROCESSED,
    },
  });

  return outStandingRegisteredNotifications;
};

interface Update {
  message: string;
  icon: string;
}

interface Recipient {
  email: string;
  id: string;
  lastName: string;
  firstName: string;
  dob: string | Date;
}

interface Originator {
  email: string;
  id: string;
  firstName: string;
  lastName: string;
}
interface NotificationData {
  userType: string;
  originator: Originator;
  activityType: string;
  cadence: Cadence;
  notificationId: string;
  recipient: Recipient;
  subject: string;
  templateId: string;
  updates: Update[];
  body: string;
}

export interface SendEmailData {
  template: string;
  subject: string;
  templateData: any;
  destination: Destination;
  forceSend?: boolean;
}

// Helper functions to break down complexity
const createTemplateUpdate = (activity: any, originatorUser: any) => {
  return {
    message: getMessageForBulkUpdateActivity(
      activity.ActivityType! as ActivityLogType,
      activity.NotificationData,
      originatorUser.User!,
      originatorUser.CaseRole === STAKEHOLDER_GROUP_ROLES.CLIENT,
      activity.CreatedAt!
    ),
    icon: `${process.env.PUBLIC_ASSET_HOST}/icons/${
      bulkUpdatesToActivitiesToIconMap[activity.ActivityType! as keyof typeof bulkUpdatesToActivitiesToIconMap] ?? ''
    }`
  };
};

const createNotificationData = (
  activity: any,
  recipient: any,
  originatorUser: any,
  userType: string,
  subject: string,
  cadence: Cadence,
  templateUpdate: any
): NotificationData => {
  return {
    subject,
    notificationId: activity.id,
    activityType: activity.ActivityType!,
    cadence: activity.NotificationCadence as Cadence,
    originator: {
      email: originatorUser.User?.Email ?? '',
      id: originatorUser.User?.id!,
      firstName: originatorUser.User?.FirstName ?? '',
      lastName: originatorUser.User?.LastName ?? '',
    },
    recipient: {
      email: recipient.User?.Email ?? '',
      id: recipient.User?.id!,
      firstName: recipient.User?.FirstName ?? '',
      lastName: recipient.User?.LastName ?? '',
      dob: recipient.User?.DOB ?? '',
    },
    updates: [templateUpdate],
    userType: userType!,
    templateId: userType === 'Client' 
      ? `${cadence.toLocaleLowerCase()}_update_client`
      : `${cadence.toLocaleLowerCase()}_update_agent`,
    body: '',
  };
};

const getNotifications = async (
  registeredActivities: Awaited<ReturnType<typeof getRegisteredActivities>>,
  cadence: Cadence,
  subject = 'New Updates',
): Promise<NotificationPayload[]> => {
  try {
    const db = getDB();
    const requiredRecipientTypes = NOTIFIABLE_CADENCE[cadence];
    const notifications: NotificationData[] = [];

    // Fetch all required cases in one query
    const registeredActivitiesCases = await db.case.findMany({
      where: {
        id: {
          in: registeredActivities.map(activity => activity.CaseId!),
        },
      },
      include: {
        CaseTeamAssignments: {
          include: {
            User: true,
          },
        },
      },
    });

    // Process each activity
    for (const activity of registeredActivities) {
      const thisCase = registeredActivitiesCases.find(subCase => subCase.id === activity.CaseId);
      
      if (!thisCase) {
        console.error(`Case not found for activity ${activity.id}`);
        continue;
      }

      const originatorUser = thisCase.CaseTeamAssignments.find(
        cta => cta.UserId === activity.OriginatorUserId
      );

      console.log('activity: ', JSON.stringify(activity, null, 2));
      console.log('originatorUser: ', JSON.stringify(originatorUser, null, 2));

      if (!originatorUser) {
        throw new CustomError('Notification Originator must be in the case', 500);
      }

      // Get eligible recipients
      const recipients = thisCase.CaseTeamAssignments.filter(cta => 
        requiredRecipientTypes.includes(cta.CaseRole as (typeof requiredRecipientTypes)[number]) &&
        cta.UserId !== activity.OriginatorUserId
      );

      const templateUpdate = createTemplateUpdate(activity, originatorUser);

      // Process each recipient
      for (const recipient of recipients) {
        const userType = recipient.CaseRole;
        if (!userType) continue;

        const existingRecipient = notifications.find(
          notif => notif.recipient.email === recipient.User?.Email && 
                   notif.userType === userType
        );

        if (existingRecipient) {
          existingRecipient.updates.push(templateUpdate);
        } else {
          const notificationData = createNotificationData(
            activity,
            recipient,
            originatorUser,
            userType,
            subject,
            cadence,
            templateUpdate
          );
          notifications.push(notificationData);
        }
      }
    }

    // Transform to final payload
    const notificationPayload = notifications.map(notification => ({
      notificationId: notification.notificationId,
      cadence: notification.cadence,
      activityType: notification.activityType! as ActivityLogType,
      recipientType: notification.userType,
      clientUser: notification.recipient.id,
      sessionStart: DateTime.now().toISO(),
      data: {
        template: notification.templateId,
        templateData: {
          updates: notification.updates,
          firstName: notification.recipient.firstName,
          lastName: notification.recipient.lastName,
        },
        destination: {
          ToAddresses: [notification.recipient.email],
        },
        forceSend: true,
        subject: notification.subject,
      },
    }));

    // Update notification status
    await db.emailNotification.updateMany({
      where: {
        id: {
          in: registeredActivities.map(notif => notif.id),
        },
      },
      data: {
        Status: EmailNotificationStatus.PROCESSED,
      },
    });

    return notificationPayload;

  } catch (error) {
    console.error('Error in getNotifications:', error);
    throw error;
  }
};

export const getHalfHourNotifications = async () => {
  const registeredActivities = await getRegisteredActivities('HALF_HOUR');

  console.log('registered half hour notifications: ', registeredActivities);

  const notifications = await getNotifications(registeredActivities, 'HALF_HOUR', 'New Updates');

  return notifications;
};

function isWithinTimeRangeEastern(): boolean {
  const now = DateTime.now().setZone('America/New_York');

  if (now.isWeekend) {
    return false;
  }

  const hours = now.hour;
  const minutes = now.minute;

  // if (hours === 9 && minutes >= 0 && minutes <= 25) {
  // Use for testing only -- remove and use above format for daily notifications after testing
  if (
    (minutes >= 0 && minutes <= 10) ||
    (minutes >= 20 && minutes <= 30) ||
    (minutes >= 40 && minutes <= 50)
  ) {
    return true;
  }

  return false;
}

export const getDailyNotifications = async () => {
  const canNotifyDaily = isWithinTimeRangeEastern();

  if (!canNotifyDaily) {
    return;
  }

  const registeredDailyNotifications = await getRegisteredActivities('DAILY');
  

  const notifications = await getNotifications(registeredDailyNotifications, 'DAILY', 'Daily Updates');

  return notifications;
};

export const send30MinsEmailsNotifs = async () => {
  const notifications = await getHalfHourNotifications();

  await requestSendEmail(notifications);
};

export const sendDailyNotifs = async () => {
  const notifications = await getDailyNotifications();

  if (notifications?.length) {
    await requestSendEmail(notifications);
  }
};

export interface NotificationPayload {
  data: SendEmailData;
  notificationId: string;
  cadence: Cadence;
  activityType: ActivityLogType;
  clientUser: string;
  recipientType: string;
  sessionStart: string;
}

export interface ImmediateEmailTemplateData {
  caseType?: string;
  documentType?: string;
  hasFamilyMember?: boolean;
  firstName: string;
  lastName: string;
  newStatus?: string;
}

type SingleActivityLog =
  | ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT
  | ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER
  | ActivityLogEnum.AGENT_ACTIVATE_CASE
  | ActivityLogEnum.AGENT_CLOSE_CASE;

type CaseStatusLog = ActivityLogEnum.AGENT_CLOSE_CASE | ActivityLogEnum.AGENT_ACTIVATE_CASE;

/**
 * Builds the payload for immediate notification emails
 */
export const buildImmediateNotifEmailPayload = (notificationData: ImmediateNotification): NotificationPayload => {
  const templateIdMap: Record<SingleActivityLog, string> = {
    [ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT]: 'immediate-danger',
    [ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER]: 'immediate-danger',
    [ActivityLogEnum.AGENT_ACTIVATE_CASE]: 'immediate-info',
    [ActivityLogEnum.AGENT_CLOSE_CASE]: 'immediate-info',
  };

  const statusMap: Record<CaseStatusLog, string> = {
    [ActivityLogEnum.AGENT_CLOSE_CASE]: 'Closed',
    [ActivityLogEnum.AGENT_ACTIVATE_CASE]: 'Active',
  };

  const caseFiles = notificationData.activityValue?.newValue;

  const fileType = caseFiles?.[0]?.GeneraGeneratedFile.FileType;
  const familyMember = caseFiles?.[0]?.GeneraGeneratedFile.UserFamilyMember;

  return {
    cadence: notificationData.cadence,
    activityType: notificationData.activityType,
    notificationId: notificationData.notificationId,
    clientUser: notificationData.recipient.id,
    recipientType: notificationData.userType,
    sessionStart: DateTime.now().toISO(),
    data: {
      destination: {
        ToAddresses: [notificationData.recipient.email],
      },
      template: templateIdMap[notificationData.activityType as SingleActivityLog],
      subject: 'Realtime updates',
      forceSend: true,
      templateData: {
        firstName: familyMember?.FirstName ?? notificationData.recipient.firstName,
        lastName: familyMember?.LastName ?? notificationData.recipient.lastName,
        newStatus: statusMap[notificationData.activityType as CaseStatusLog],
        documentType: fileType,
        hasFamilyMember: !!familyMember,
      },
    },
  };
};

/**
 * Saves the processed notifications to the database
 */
export const saveProcessedNotifications = async (notification: NotificationPayload) => {
  const db = getDB();

  console.log('saving notifications: ', notification);
  await db.sentEmailNotification.create({
    data: {
      NotificationCadence: notification.cadence,
      NotificationRecipientType: notification.recipientType,
      SessionStart: notification.sessionStart,
      ClientUserId: notification.clientUser,
      Payload: notification.data,
      SessionEnd: DateTime.now().toISO(),
    },
  });
};
