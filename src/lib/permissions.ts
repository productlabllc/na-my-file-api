import { STAKEHOLDER_GROUP_ROLES as SGR } from './constants';

// Users Permission.
export const CAN_UPLOAD_CASE_FILE_FOR_CLIENT = [
  SGR.CBO_STAFFER,
  SGR.CBO_SUPERVISOR,
  SGR.HPD_ADMIN,
  SGR.HPD_AGENT,
  SGR.DHS_ADMIN,
  SGR.DHS_AGENT,
  SGR.PATH_ADMIN,
  SGR.PATH_AGENT,
  SGR.CLIENT,
  SGR.TRUSTED_USER,
];

export const CAN_DOWNLOAD_CASE_FILE = [
  SGR.CBO_STAFFER,
  SGR.CBO_SUPERVISOR,
  SGR.SPONSOR,
  SGR.HPD_ADMIN,
  SGR.HPD_AGENT,
  SGR.DHS_ADMIN,
  SGR.DHS_AGENT,
  SGR.PATH_ADMIN,
  SGR.PATH_AGENT,
  SGR.CLIENT,
  SGR.TRUSTED_USER,
];

export const CAN_GET_USER_CASE = [
  SGR.CBO_STAFFER,
  SGR.CBO_SUPERVISOR,
  SGR.SPONSOR,
  SGR.HPD_ADMIN,
  SGR.HPD_AGENT,
  SGR.DHS_ADMIN,
  SGR.DHS_AGENT,
  SGR.PATH_ADMIN,
  SGR.PATH_AGENT,
  SGR.CLIENT,
  SGR.TRUSTED_USER,
];

export const CAN_VIEW_CASE_FILE_STATUS = [
  SGR.CBO_STAFFER,
  SGR.CBO_SUPERVISOR,
  SGR.SPONSOR,
  SGR.HPD_ADMIN,
  SGR.HPD_AGENT,
  SGR.DHS_ADMIN,
  SGR.DHS_AGENT,
  SGR.PATH_ADMIN,
  SGR.PATH_AGENT,
  SGR.CLIENT,
  SGR.TRUSTED_USER,
];

export const CAN_CHANGE_CASE_FILE_STATUS = [
  SGR.PATH_ADMIN,
  SGR.PATH_AGENT,
  SGR.DHS_ADMIN,
  SGR.DHS_AGENT,
  SGR.HPD_ADMIN,
  SGR.HPD_AGENT,
];

export const CAN_VIEW_CASE_WORKFLOW_STAGE_STATUS = [
  SGR.CBO_STAFFER,
  SGR.CBO_SUPERVISOR,
  SGR.SPONSOR,
  SGR.HPD_ADMIN,
  SGR.HPD_AGENT,
  SGR.DHS_ADMIN,
  SGR.DHS_AGENT,
  SGR.PATH_ADMIN,
  SGR.PATH_AGENT,
  SGR.CLIENT,
  SGR.TRUSTED_USER,
];

export const CAN_CHANGE_CASE_WORKFLOW_STAGE_STATUS = [SGR.SPONSOR, SGR.PATH_ADMIN, SGR.PATH_AGENT];

export const CAN_VIEW_CASE_STATUS = [
  SGR.CBO_STAFFER,
  SGR.CBO_SUPERVISOR,
  SGR.SPONSOR,
  SGR.HPD_ADMIN,
  SGR.HPD_AGENT,
  SGR.DHS_ADMIN,
  SGR.DHS_AGENT,
  SGR.PATH_ADMIN,
  SGR.PATH_AGENT,
  SGR.CLIENT,
  SGR.TRUSTED_USER,
];

export const CAN_CHANGE_CASE_STATUS = [
  SGR.HPD_ADMIN,
  SGR.HPD_AGENT,
  SGR.DHS_ADMIN,
  SGR.DHS_AGENT,
  SGR.PATH_ADMIN,
  SGR.PATH_AGENT,
];

export default {
  CAN_CHANGE_CASE_FILE_STATUS,
  CAN_CHANGE_CASE_STATUS,
  CAN_CHANGE_CASE_WORKFLOW_STAGE_STATUS,
  CAN_VIEW_CASE_WORKFLOW_STAGE_STATUS,
  CAN_VIEW_CASE_FILE_STATUS,
  CAN_GET_USER_CASE,
  CAN_DOWNLOAD_CASE_FILE,
  CAN_UPLOAD_CASE_FILE_FOR_CLIENT,
};