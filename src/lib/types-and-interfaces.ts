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
  'CLIENT_HEAD_OF_HOUSEHOLD'
  | 'CLIENT_FAMILY_MEMBER'
  | 'CLIENT_TRUSTED_USER'
  | 'AGENCY_EMPLOYEE'
  | 'AGENCY_ADMIN'
  | 'MARKETING_AGENT'
  | 'PROPERTY_OWNER'
  | 'PROPERTY_MANAGER';

export type PartnerRoleType = 'PARTNER_ACCOUNT_PRIMARY_MEMBER' | 'PARTNER_ACCOUNT_ADMIN' | 'PARTNER_ACCOUNT_MEMBER';

export type ActivityLogType = 
/* All Users */
'LOGIN'
| 'LOGOUT'
| 'VIEW_CASE'
| 'VIEW_CASE_FILE_LIST'
| 'VIEW_CASE_FAMILY_MEMBERS'
| 'VIEW_CASE_TEAM_MEMBERS'

/* Client User Activities */
| 'UPDATE_PROFILE_SELF'
| 'CREATE_FAMILY_MEMBER'
| 'UPDATE_FAMILY_MEMBER'
| 'DELETE_FAMILY_MEMBERS'
| 'GET_FAMILY_MEMBER_BY_ID'
| 'GET_ALL_USER_FAMILY_MEMBERS'
| 'UPLOAD_DOCUMENT_SELF'
| 'UPDATE_DOCUMENT_SELF'
| 'UPLOAD_DOCUMENT_FAMILY_MEMBER'
| 'UPDATE_DOCUMENT_FAMILY_MEMBER'
| 'DOWNLOAD_DOCUMENT_SELF'
| 'DOWNLOAD_DOCUMENT_FAMILY_MEMBER'
| 'DELETE_DOCUMENT_SELF'
| 'DELETE_DOCUMENT_FAMILY_MEMBER'
| 'CREATE_CASE'
| 'DELETE_CASE'
| 'UPDATE_CASE'
| 'GET_CASE_BY_ID'
| 'GET_ALL_USER_CASES'
| 'ADD_CASE_FILES'
| 'GET_CASE_FILE_LISTING'
| 'REMOVE_CASE_FILES'
| 'UPDATE_CASE_FILE'
| 'GET_CASE_FAMILY_MEMBERS'
| 'ADD_CASE_FAMILY_MEMBERS'
| 'REMOVE_CASE_FAMILY_MEMBERS'
| 'SATISFY_CASE_WORKFLOW_CRITERIA'
| 'REMOVE_CASE_WORKFLOW_CRITERIA'

/* Agency User Activities */
| 'DOWNLOAD_CASE_FILE'
| 'DOWNLOAD_ALL_CASE_FILES'
| 'APPROVE_CASE_CRITERIA'
| 'REJECT_CASE_CRITERIA'
| 'ADD_NEW_CASE_NOTE'
| 'REPLY_TO_CASE_NOTE'
| 'EDIT_CASE_NOTE'
| 'REMOVE_CASE_NOTE';

export type ActivityLogRelatedEntityType = 
'CASE'
| 'CASE_FILE'
| 'FAMILY_MEMBER'
| 'CASE_APPLICANT';

export type ActivityLogMessageType = {
  activityType: ActivityLogType;
  activityValue: string;
  userId: string;
  timestamp: Date;
  activityRelatedEntity?: ActivityLogRelatedEntityType;
  activityRelatedEntityId?: string;
  metadataJson: string;
};