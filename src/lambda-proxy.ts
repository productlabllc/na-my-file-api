import { lambdaRouteProxyEntryHandler, lambdaRouteProxyPathNotFound } from 'aws-lambda-api-tools';
import { config } from './routes-config';

// Import route modules

// UserFiles
import rmUserFiles_GetUserFiles from './routes/user-files/get-user-files';
import rmUserFiles_UpdateUserFile from './routes/user-files/update-user-file';
import rmUserFiles_DeleteUserFile from './routes/user-files/delete-user-file';
import rmUserFiles_GetUserFamilyMemberFiles from './routes/user-files/get-user-family-member-files';
import rmUserFiles_GenerateUserFile from './routes/user-files/generate-user-file';
import rmUserFiles_GetUserFileDownloadUrl from './routes/user-files/get-user-file-download-url';
import rmUserFiles_GetGeneratedFileCases from './routes/user-files/get-generated-file-cases';
import rmUserFiles_UpdateGeneratedFile from './routes/user-files/update-generated-file';
import rmUserFiles_GetGeneratedFileDownloadUrl from './routes/user-files/get-generated-file-download-url';
import rmUserFiles_GetMyFiles from './routes/user-files/get-my-files';
import rmUserFiles_GetGeneratedFile from './routes/user-files/get-generated-file-by-id';
import rmUserFiles_DeleteGenerateFile from './routes/user-files/delete-generated-file-by-id';
import rmmUserFiles_GetGeneratedFileThumbnailDownloadUrl from './routes/user-files/get-generated-file-thumbnail-download-url';
import rmUserFiles_GetUserFileTypes from './routes/user-files/get-user-file-types';

// Users
import rmUsers_GetUserByToken from './routes/users/get-user-by-token';
import rmUsers_UpdateUser from './routes/users/update-user';
import rmUsers_DeleteUser from './routes/users/delete-user';
import rmUsers_GetUserActivity from './routes/users/get-user-activity';
import rmUsers_CreateUser from './routes/users/create-user';
import rmUsers_GetUsersCases from './routes/users/get-users-cases';
import rmUsers_GetUser from './routes/users/get-user-by-id';

// Activities
import rmActivity_GetActivitiesByUser from './routes/activities/get-activity-by-user-id';
import rmActivity_MarkActivityAsSeen from './routes/activities/mark-case-activity-as-seen';

// UserFamilyMember
import rmUserFamilyMember_GetUserFamilyMember from './routes/user-family/get-user-family-member';
import rmUserFamilyMember_GetUserFamilyMembers from './routes/user-family/get-user-family-members';
import rmUserFamilyMember_CreateUserFamilyMember from './routes/user-family/create-user-family-member';
import rmUserFamilyMember_UpdateUserFamilyMember from './routes/user-family/update-user-family-member';
import rmUserFamilyMember_DeleteUserFamilyMember from './routes/user-family/delete-user-family-member';

// Case Applicants
import rmCaseApplicants_AddCaseApplicants from './routes/case-family-members/add-case-family-members';
import rmCaseApplicants_RemoveCaseApplicants from './routes/case-family-members/remove-case-family-members';
import rmCaseApplicants_GetCaseApplicants from './routes/case-family-members/get-case-family-members';

// Cases
import rm_CreateCase from './routes/cases/create-case';
import rm_DeleteCase from './routes/cases/delete-case';
import rm_UpdateCase from './routes/cases/update-case';
import rm_GetCaseById from './routes/cases/get-case-by-id';
import rm_GetUserCases from './routes/cases/get-user-cases';
import rm_GetCasesByUserId from './routes/cases/get-cases-by-user-id';
import rm_LogViewCaseFamilyMember from './routes/cases/log-view-case-family-member';

// Case Criterion
import rmCaseCriterion_UpdateCaseCriterion from './routes/case-criteria/update-criterion';
import rmCaseCriterion_GetCriterionCaseFiles from './routes/case-criteria/get-criterion-case-files';
import rmCaseCriterion_DeleteCaseCriterion from './routes/case-criteria/remove-case-criterion';
import rmCaseCriterion_ApproveChecklist from './routes/case-criteria/approve-criteria';

// Case Files
import rmCaseFiles_AddCaseFiles from './routes/case-files/add-case-files';
import rmCaseFiles_RemoveCaseFiles from './routes/case-files/remove-case-files';
import rmCaseFiles_GetCaseFilesStatus from './routes/case-files/get-case-file-listing';
import rmCaseFiles_UpdateCaseFile from './routes/case-files/update-case-file';
import rmCaseFiles_LogDownloadCaseFiles from './routes/case-files/log-download-case-files';
import rmCaseFiles_LogPreviewCaseFile from './routes/case-files/log-preview-case-file';

// Case notes
import rmCaseNotes_GetCaseNotes from './routes/case-notes/get-case-notes';
import rmCaseNotes_AddCaseNote from './routes/case-notes/add-case-note';
import rmCaseNotes_EditCaseNote from './routes/case-notes/edit-case-note';
import rmCaseNotes_DeleteCaseNote from './routes/case-notes/delete-case-note';

// Workflows
import rmWorkFlows_GetWorkflows from './routes/workflows/get-workflows';

// Languages
import rmLanguages_GetLanguages from './routes/languages/get-languages';

// Languages
import rmLookups_GetActivityLogTypes from './routes/lookups/get-activity-log-types';

// NYCID
// import rmNycid_Token from './routes/nycid/token';
// import rmNycid_UserInfo from './routes/nycid/userinfo';

// Messaging
import rmMessaging_PostMessageToConnections from './routes/messaging/post-message-to-ws-connections';

// Constants
import rmConstants_getConstants from './routes/constants/get-constants';

const routeModules: { [key: string]: any } = {
  // Workflows
  'workflows/get-workflows': rmWorkFlows_GetWorkflows,

  // Languages
  'languages/get-languages': rmLanguages_GetLanguages,

  // Languages
  'lookups/get-activity-log-types': rmLookups_GetActivityLogTypes,

  // CaseFiles
  'case-files/add-case-files': rmCaseFiles_AddCaseFiles,
  'case-files/remove-case-files': rmCaseFiles_RemoveCaseFiles,
  'case-files/log-preview-case-file': rmCaseFiles_LogPreviewCaseFile,
  'case-files/get-case-file-listing': rmCaseFiles_GetCaseFilesStatus,
  'case-files/update-case-file': rmCaseFiles_UpdateCaseFile,
  'case-files/log-download-case-files': rmCaseFiles_LogDownloadCaseFiles,

  // Cases
  'cases/create-case': rm_CreateCase,
  'cases/get-case-by-id': rm_GetCaseById,
  'cases/get-user-cases': rm_GetUserCases,
  'cases/update-case': rm_UpdateCase,
  'cases/delete-case': rm_DeleteCase,
  'cases/get-cases-by-user-id': rm_GetCasesByUserId,
  'cases/log-view-case-family-member': rm_LogViewCaseFamilyMember,

  // Activities
  'activities/get-activity-by-user-id': rmActivity_GetActivitiesByUser,
  'activities/mark-case-activity-as-seen': rmActivity_MarkActivityAsSeen,

  // Case Criterion
  'case-criteria/update-criterion': rmCaseCriterion_UpdateCaseCriterion,
  'case-criteria/get-criterion-case-files': rmCaseCriterion_GetCriterionCaseFiles,
  'case-criteria/remove-case-criterion': rmCaseCriterion_DeleteCaseCriterion,
  'case-criteria/approve-criteria': rmCaseCriterion_ApproveChecklist,

  // UserFamilyMember
  'user-family/create-user-family-member': rmUserFamilyMember_CreateUserFamilyMember,
  'user-family/update-user-family-member': rmUserFamilyMember_UpdateUserFamilyMember,
  'user-family/delete-user-family-member': rmUserFamilyMember_DeleteUserFamilyMember,
  'user-family/get-user-family-member': rmUserFamilyMember_GetUserFamilyMember,
  'user-family/get-user-family-members': rmUserFamilyMember_GetUserFamilyMembers,

  // CaseApplicants (Family Members)
  'case-family-members/add-case-family-members': rmCaseApplicants_AddCaseApplicants,
  'case-family-members/remove-case-family-members': rmCaseApplicants_RemoveCaseApplicants,
  'case-family-members/get-case-family-members': rmCaseApplicants_GetCaseApplicants,

  // Case Notes
  'case-notes/add-case-note': rmCaseNotes_AddCaseNote,
  'case-notes/edit-case-note': rmCaseNotes_EditCaseNote,
  'case-notes/get-case-notes': rmCaseNotes_GetCaseNotes,
  'case-notes/delete-case-note': rmCaseNotes_DeleteCaseNote,

  // User Files
  'user-files/get-user-files': rmUserFiles_GetUserFiles,
  'user-files/update-user-file': rmUserFiles_UpdateUserFile,
  'user-files/delete-user-file': rmUserFiles_DeleteUserFile,
  'user-files/get-user-family-member-files': rmUserFiles_GetUserFamilyMemberFiles,
  'user-files/generate-user-file': rmUserFiles_GenerateUserFile,
  'user-files/get-user-file-download-url': rmUserFiles_GetUserFileDownloadUrl,
  'user-files/get-generated-file-cases': rmUserFiles_GetGeneratedFileCases,
  'user-files/update-generated-file': rmUserFiles_UpdateGeneratedFile,
  'user-files/get-generated-file-download-url': rmUserFiles_GetGeneratedFileDownloadUrl,
  'user-files/get-my-files': rmUserFiles_GetMyFiles,
  'user-files/get-generated-file-by-id': rmUserFiles_GetGeneratedFile,
  'user-files/delete-generated-file-by-id': rmUserFiles_DeleteGenerateFile,
  'user-files/get-generated-file-thumbnail-download-url': rmmUserFiles_GetGeneratedFileThumbnailDownloadUrl,
  'user-files/get-user-file-types': rmUserFiles_GetUserFileTypes,

  // Users
  'users/get-user-by-token': rmUsers_GetUserByToken,
  'users/update-user': rmUsers_UpdateUser,
  'users/delete-user': rmUsers_DeleteUser,
  'users/get-user-activity': rmUsers_GetUserActivity,
  'users/create-user': rmUsers_CreateUser,
  'users/get-users-cases': rmUsers_GetUsersCases,
  'users/get-user-by-id': rmUsers_GetUser,

  // Messaging
  'messaging/post-message-to-ws-connections': rmMessaging_PostMessageToConnections,

  // Constants
  'constants/get-constants': rmConstants_getConstants,

  // 404 - Not Found
  'not-found': lambdaRouteProxyPathNotFound,
};

export const handler = lambdaRouteProxyEntryHandler(config, routeModules);
