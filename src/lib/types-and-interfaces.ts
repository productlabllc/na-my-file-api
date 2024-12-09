export type CognitoJwtType = {
  aud: string;
  auth_time: number;
  'cognito:username': string;
  email: string;
  email_verified: boolean;
  event_id: string;
  exp: number;
  family_name: string;
  given_name: string;
  iat: number;
  iss: string;
  jti: string;
  origin_jti: string;
  sub: string;
  token_use: string;
};

export type StakeholderGroupRoleType =
  | 'CLIENT_HEAD_OF_HOUSEHOLD'
  | 'CLIENT_FAMILY_MEMBER'
  | 'CLIENT_TRUSTED_USER'
  | 'AGENCY_EMPLOYEE'
  | 'AGENCY_ADMIN'
  | 'MARKETING_AGENT'
  | 'PROPERTY_OWNER'
  | 'PROPERTY_MANAGER';

export type PartnerRoleType = 'PARTNER_ACCOUNT_PRIMARY_MEMBER' | 'PARTNER_ACCOUNT_ADMIN' | 'PARTNER_ACCOUNT_MEMBER';

export enum ActivityLogEnum {
  /* All Users */
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CLIENT_GET_CASE_BY_ID = 'CLIENT_GET_CASE_BY_ID',
  CLIENT_VIEW_CASE_FILE_LIST = 'CLIENT_VIEW_CASE_FILE_LIST',
  CLIENT_VIEW_CASE_FAMILY_MEMBERS = 'CLIENT_VIEW_CASE_FAMILY_MEMBERS',
  CLIENT_VIEW_CASE_TEAM_MEMBERS = 'CLIENT_VIEW_CASE_TEAM_MEMBERS',

  /* Client User Activities */
  CLIENT_UPDATE_PROFILE_SELF = 'CLIENT_UPDATE_PROFILE_SELF',
  AGENT_UPDATE_PROFILE_SELF = 'AGENT_UPDATE_PROFILE_SELF',
  AGENT_UPDATE_CASE_CRITERION = 'AGENT_UPDATE_CASE_CRITERION',
  CLIENT_CREATE_FAMILY_MEMBER = 'CLIENT_CREATE_FAMILY_MEMBER',
  CLIENT_UPDATE_FAMILY_MEMBER = 'CLIENT_UPDATE_FAMILY_MEMBER',
  CLIENT_DELETE_FAMILY_MEMBERS = 'CLIENT_DELETE_FAMILY_MEMBERS',
  CLIENT_GET_FAMILY_MEMBER_BY_ID = 'CLIENT_GET_FAMILY_MEMBER_BY_ID',
  CLIENT_GET_ALL_USER_FAMILY_MEMBERS = 'CLIENT_GET_ALL_USER_FAMILY_MEMBERS',
  CLIENT_UPLOAD_DOCUMENT_SELF = 'CLIENT_UPLOAD_DOCUMENT_SELF',
  CLIENT_UPDATE_DOCUMENT_SELF = 'CLIENT_UPDATE_DOCUMENT_SELF',
  CLIENT_UPLOAD_DOCUMENT_FAMILY_MEMBER = 'CLIENT_UPLOAD_DOCUMENT_FAMILY_MEMBER',
  CLIENT_UPDATE_DOCUMENT_FAMILY_MEMBER = 'CLIENT_UPDATE_DOCUMENT_FAMILY_MEMBER',
  CLIENT_DOWNLOAD_DOCUMENT_SELF = 'CLIENT_DOWNLOAD_DOCUMENT_SELF',
  CLIENT_DOWNLOAD_DOCUMENT_FAMILY_MEMBER = 'CLIENT_DOWNLOAD_DOCUMENT_FAMILY_MEMBER',
  CLIENT_DELETE_DOCUMENT_SELF = 'CLIENT_DELETE_DOCUMENT_SELF',
  CLIENT_DELETE_DOCUMENT_FAMILY_MEMBER = 'CLIENT_DELETE_DOCUMENT_FAMILY_MEMBER',
  CLIENT_CREATE_CASE = 'CLIENT_CREATE_CASE',
  CLIENT_DELETE_CASE = 'CLIENT_DELETE_CASE',
  CLIENT_UPDATE_CASE = 'CLIENT_UPDATE_CASE',
  CLIENT_ADD_CASE_FILES_SELF = 'CLIENT_ADD_CASE_FILES_SELF',
  AGENT_GET_ALL_USER_CASES = 'AGENT_GET_ALL_USER_CASES',
  AGENT_PREVIEW_CASE_FILE = 'AGENT_PREVIEW_CASE_FILE',
  CLIENT_ADD_CASE_FILES_FAMILY_MEMBER = 'CLIENT_ADD_CASE_FILES_FAMILY_MEMBER',
  AGENT_GET_USER_CASES = 'AGENT_GET_USER_CASES',
  GET_CASES_ADMIN = 'GET_CASES_ADMIN',
  CLIENT_REMOVE_CASE_FILES_SELF = 'CLIENT_REMOVE_CASE_FILES_SELF',
  CLIENT_UPDATE_CASE_FILE_SELF = 'CLIENT_UPDATE_CASE_FILE_SELF',
  AGENT_UPDATE_CASE_FILE_CLIENT = 'AGENT_UPDATE_CASE_FILE_CLIENT',
  CLIENT_GET_CASE_FAMILY_MEMBERS = 'CLIENT_GET_CASE_FAMILY_MEMBERS',
  CLIENT_ADD_CASE_FAMILY_MEMBERS = 'CLIENT_ADD_CASE_FAMILY_MEMBERS',
  CLIENT_REMOVE_CASE_FAMILY_MEMBERS = 'CLIENT_REMOVE_CASE_FAMILY_MEMBERS',
  AGENT_APPROVE_DOCUMENT_CHECKLIST = 'AGENT_APPROVE_DOCUMENT_CHECKLIST',
  AGENT_REMOVE_CASE_WORKFLOW_CRITERIA = 'AGENT_REMOVE_CASE_WORKFLOW_CRITERIA',
  AGENT_ACTIVATE_CASE = 'AGENT_ACTIVATE_CASE',

  /* Agency User Activities */
  AGENT_DOWNLOAD_CASE_FILE_CLIENT = 'AGENT_DOWNLOAD_CASE_FILE_CLIENT',
  AGENT_DOWNLOAD_ALL_CASE_FILES = 'AGENT_DOWNLOAD_ALL_CASE_FILES',
  AGENT_APPROVE_CASE_FILE_CLIENT = 'AGENT_APPROVE_CASE_FILE_CLIENT',
  AGENT_REJECT_CASE_FILE_CLIENT = 'AGENT_REJECT_CASE_FILE_CLIENT',
  AGENT_CLOSE_CASE = 'AGENT_CLOSE_CASE',
  AGENT_GET_CASE_FILE_LISTING = 'AGENT_GET_CASE_FILE_LISTING',
  AGENT_UPDATE_CASE_FILE_FAMILY_MEMBER = 'AGENT_UPDATE_CASE_FILE_FAMILY_MEMBER',
  AGENT_ADD_NEW_CASE_NOTE = 'AGENT_ADD_NEW_CASE_NOTE',
  AGENT_REPLY_TO_CASE_NOTE = 'AGENT_REPLY_TO_CASE_NOTE',
  AGENT_EDIT_CASE_NOTE = 'AGENT_EDIT_CASE_NOTE',
  AGENT_REMOVE_CASE_NOTE = 'AGENT_REMOVE_CASE_NOTE',
  AGENT_ADD_CASE_FILES_FAMILY_MEMBER = 'AGENT_ADD_CASE_FILES_FAMILY_MEMBER',
  AGENT_ADD_CASE_FILE_CLIENT = 'AGENT_ADD_CASE_FILE_CLIENT',
  AGENT_UPLOAD_DOCUMENT_CLIENT = 'AGENT_UPLOAD_DOCUMENT_CLIENT',
  AGENT_UPLOAD_DOCUMENT_FAMILY_MEMBER = 'AGENT_UPLOAD_DOCUMENT_FAMILY_MEMBER',
  AGENT_UPDATE_DOCUMENT_CLIENT = 'AGENT_UPDATE_DOCUMENT_CLIENT',
  AGENT_UPDATE_DOCUMENT_FAMILY_MEMBER = 'AGENT_UPDATE_DOCUMENT_FAMILY_MEMBER',
  CLIENT_REMOVE_CASE_FILES_FAMILY_MEMBER = 'CLIENT_REMOVE_CASE_FILES_FAMILY_MEMBER',
  CLIENT_UPDATE_CASE_FILE_FAMILY_MEMBER = 'CLIENT_UPDATE_CASE_FILE_FAMILY_MEMBER',
  CLIENT_RESUBMIT_CASE_FILES_SELF = 'CLIENT_RESUBMIT_CASE_FILES_SELF',
  CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER = 'CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER',
  AGENT_RESUBMIT_CASE_FILES_CLIENT = 'AGENT_RESUBMIT_CASE_FILES_CLIENT',
  AGENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER = 'AGENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER',
  AGENT_REJECT_CASE_FILE_FAMILY_MEMBER = 'AGENT_REJECT_CASE_FILE_FAMILY_MEMBER',
  AGENT_DOWNLOAD_CASE_FILE_FAMILY_MEMBER = 'AGENT_DOWNLOAD_CASE_FILE_FAMILY_MEMBER',
  AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER = 'AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER',
  AGENT_VIEW_CASE_NOTES = 'AGENT_VIEW_CASE_NOTES',
  AGENT_UNDER_REVIEW_CASE_FILE_CLIENT = 'AGENT_UNDER_REVIEW_CASE_FILE_CLIENT',
  AGENT_UNDER_REVIEW_CASE_FILE_FAMILY_MEMBER = 'AGENT_UNDER_REVIEW_CASE_FILE_FAMILY_MEMBER',
  AGENT_PENDING_CASE_FILE_CLIENT = 'AGENT_PENDING_CASE_FILE_CLIENT',
  AGENT_PENDING_CASE_FILE_FAMILY_MEMBER = 'AGENT_PENDING_CASE_FILE_FAMILY_MEMBER',
}

// Step 2: Create union type from the enum
export type ActivityLogType = keyof typeof ActivityLogEnum;

export const ClientCaseActivities = [
  ActivityLogEnum.CLIENT_CREATE_CASE,
  ActivityLogEnum.CLIENT_DELETE_CASE,
  ActivityLogEnum.CLIENT_UPDATE_CASE,
  ActivityLogEnum.CLIENT_GET_CASE_BY_ID,
  ActivityLogEnum.CLIENT_ADD_CASE_FAMILY_MEMBERS,
  ActivityLogEnum.CLIENT_REMOVE_CASE_FAMILY_MEMBERS,
  ActivityLogEnum.CLIENT_REMOVE_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_VIEW_CASE_FILE_LIST,
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_SELF,
  ActivityLogEnum.CLIENT_VIEW_CASE_FAMILY_MEMBERS,
  ActivityLogEnum.CLIENT_VIEW_CASE_TEAM_MEMBERS,
  ActivityLogEnum.CLIENT_GET_CASE_FAMILY_MEMBERS,
  ActivityLogEnum.CLIENT_UPDATE_CASE_FILE_SELF,
];

export const ClientFamilyCaseActivities = [
  ActivityLogEnum.CLIENT_ADD_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_REMOVE_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_UPDATE_CASE_FILE_FAMILY_MEMBER,
];

export const AgentCaseActivities = [
  ActivityLogEnum.AGENT_ADD_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_RESUBMIT_CASE_FILES_CLIENT,
  ActivityLogEnum.AGENT_RESUBMIT_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_ADD_NEW_CASE_NOTE,
  ActivityLogEnum.AGENT_REPLY_TO_CASE_NOTE,
  ActivityLogEnum.AGENT_CLOSE_CASE,
  ActivityLogEnum.AGENT_UNDER_REVIEW_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_REMOVE_CASE_NOTE,
  ActivityLogEnum.AGENT_ACTIVATE_CASE,
  ActivityLogEnum.AGENT_DOWNLOAD_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_DOWNLOAD_ALL_CASE_FILES,
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_VIEW_CASE_NOTES,
  ActivityLogEnum.AGENT_PENDING_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_EDIT_CASE_NOTE,
  ActivityLogEnum.AGENT_UPDATE_CASE_FILE_CLIENT,
  ActivityLogEnum.AGENT_PREVIEW_CASE_FILE,
  ActivityLogEnum.AGENT_GET_CASE_FILE_LISTING,
];

export const AgentFamilyMemberCaseActivities = [
  ActivityLogEnum.AGENT_APPROVE_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_PENDING_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_REJECT_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_ADD_CASE_FILES_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_DOWNLOAD_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_UNDER_REVIEW_CASE_FILE_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_UPDATE_CASE_FILE_FAMILY_MEMBER,
];

// Step 3: Construct array types using enum
export const CaseActivityLogTypes: ActivityLogEnum[] = [
  ...AgentCaseActivities,
  ...ClientCaseActivities,
  ...ClientFamilyCaseActivities,
  ...AgentFamilyMemberCaseActivities,
];

// Step 4: Construct the full activity log type array using enum
export const ActivityLogTypesList: ActivityLogEnum[] = [
  /* All Users */
  ActivityLogEnum.LOGIN,
  ActivityLogEnum.LOGOUT,

  /* Client User Activities */
  ActivityLogEnum.CLIENT_UPDATE_PROFILE_SELF,
  ActivityLogEnum.CLIENT_CREATE_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_UPDATE_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_DELETE_FAMILY_MEMBERS,
  ActivityLogEnum.CLIENT_GET_FAMILY_MEMBER_BY_ID,
  ActivityLogEnum.CLIENT_GET_ALL_USER_FAMILY_MEMBERS,
  ActivityLogEnum.CLIENT_UPLOAD_DOCUMENT_SELF,
  ActivityLogEnum.CLIENT_UPDATE_DOCUMENT_SELF,
  ActivityLogEnum.CLIENT_UPLOAD_DOCUMENT_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_UPDATE_DOCUMENT_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_DOWNLOAD_DOCUMENT_SELF,
  ActivityLogEnum.CLIENT_DOWNLOAD_DOCUMENT_FAMILY_MEMBER,
  ActivityLogEnum.CLIENT_DELETE_DOCUMENT_SELF,
  ActivityLogEnum.CLIENT_DELETE_DOCUMENT_FAMILY_MEMBER,

  /* Agency User Activities */
  ActivityLogEnum.AGENT_UPDATE_CASE_CRITERION,
  ActivityLogEnum.AGENT_UPDATE_PROFILE_SELF,
  ActivityLogEnum.AGENT_UPLOAD_DOCUMENT_CLIENT,
  ActivityLogEnum.AGENT_UPLOAD_DOCUMENT_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_UPDATE_DOCUMENT_CLIENT,
  ActivityLogEnum.AGENT_UPDATE_DOCUMENT_FAMILY_MEMBER,
  ActivityLogEnum.AGENT_GET_ALL_USER_CASES,
  ActivityLogEnum.AGENT_APPROVE_DOCUMENT_CHECKLIST,
  ActivityLogEnum.AGENT_REMOVE_CASE_WORKFLOW_CRITERIA,

  ...CaseActivityLogTypes,
];

export type ActivityLogRelatedEntityType =
  | 'CASE'
  | 'USER_CASE'
  | 'CASE_FILE'
  | 'FAMILY_MEMBER'
  | 'CASE_APPLICANT'
  | 'USER_FILE'
  | 'CASE_FAMILY_MEMBER'
  | 'CASE_NOTE'
  | 'CASE_CRITERION'
  | 'WORKFLOW_STAGE';

export type ActivityLogMessageType = {
  activityType: ActivityLogType;
  caseFilIds?: string[];
  familyMemberIds?: string[];
  activityValue: string;
  activityCategory?: 'case' | 'platform';
  userId: string;
  timestamp: Date;
  activityRelatedEntity?: ActivityLogRelatedEntityType;
  activityRelatedEntityId?: string;
  metadataJson: string;
};
