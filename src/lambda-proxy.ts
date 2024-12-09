import { lambdaRouteProxyEntryHandler, lambdaRouteProxyPathNotFound } from 'aws-lambda-api-tools';
import { config } from './routes-config';

// Import route modules

// UserFiles
import rmUserFiles_GetUserFiles from './routes/user-files/get-user-files';
import rmUserFiles_UpdateUserFile from './routes/user-files/update-user-file';
import rmUserFiles_DeleteUserFile from './routes/user-files/delete-user-file';
import rmUserFiles_GetUserFamilyMemberFiles from './routes/user-files/get-user-family-member-files';
import rmUserFiles_CreateUserFile from './routes/user-files/create-user-file';
import rmUserFiles_GetUserFileDownloadUrl from './routes/user-files/get-user-file-download-url';
import rmUserFiles_GetUserFileCases from './routes/user-files/get-user-file-cases';
import rmUserFiles_UpdateGeneratedFile from './routes/user-files/update-generated-file';
import rmUserFiles_GetGeneratedFileDownloadUrl from './routes/user-files/get-generated-file-download-url';

// Users
import rmUsers_GetUserByToken from './routes/users/get-user-by-token';
import rmUsers_UpdateUser from './routes/users/update-user';
import rmUsers_DeleteUser from './routes/users/delete-user';
import rmUsers_GetUserActivity from './routes/users/get-user-activity';
import rmUsers_CreateUser from './routes/users/create-user';

// User workflows
import rmUserWorkflows_GetUserWorkflows from './routes/user-workflows/get-user-workflows';
import rmUserWorkflows_AddUserWorkflow from './routes/user-workflows/add-user-workflow';
import rmUserWorkflows_RemoveUserWorkflow from './routes/user-workflows/remove-user-workflow';

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

// Case Files
import rmCaseFiles_AddCaseFiles from './routes/case-files/add-case-files';
import rmCaseFiles_RemoveCaseFiles from './routes/case-files/remove-case-files';
import rmCaseFiles_GetCaseUserFiles from './routes/case-files/get-case-user-files';
import rmCaseFiles_GetCaseFilesStatus from './routes/case-files/get-case-file-listing';
import rmCaseFiles_UpdateCaseFile from './routes/case-files/update-case-file';

// Workflows
import rmWorkFlows_GetWorkflows from './routes/workflows/get-workflows';

// Languages
import rmLanguages_GetLanguages from './routes/languages/get-languages';

// NYCID
// import rmNycid_Token from './routes/nycid/token';
// import rmNycid_UserInfo from './routes/nycid/userinfo';

// Messaging
import rmMessaging_PostMessageToConnections from './routes/messaging/post-message-to-ws-connections';

const routeModules: { [key: string]: any } = {
  // User workflows
  'user-workflows/get-user-workflows': rmUserWorkflows_GetUserWorkflows,
  'user-workflows/add-user-workflow': rmUserWorkflows_AddUserWorkflow,
  'user-workflows/remove-user-workflow': rmUserWorkflows_RemoveUserWorkflow,

  // Workflows
  'workflows/get-workflows': rmWorkFlows_GetWorkflows,

  // Languages
  'languages/get-languages': rmLanguages_GetLanguages,

  // CaseFiles
  'case-files/add-case-files': rmCaseFiles_AddCaseFiles,
  'case-files/remove-case-files': rmCaseFiles_RemoveCaseFiles,
  // 'case-files/get-case-user-files': rmCaseFiles_GetCaseUserFiles,
  'case-files/get-case-file-listing': rmCaseFiles_GetCaseFilesStatus,
  'case-files/update-case-file': rmCaseFiles_UpdateCaseFile,

  // Cases
  'cases/create-case': rm_CreateCase,
  'cases/get-case-by-id': rm_GetCaseById,
  'cases/get-user-cases': rm_GetUserCases,
  'cases/update-case': rm_UpdateCase,
  'cases/delete-case': rm_DeleteCase,

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

  // User Files
  'user-files/get-user-files': rmUserFiles_GetUserFiles,
  'user-files/update-user-file': rmUserFiles_UpdateUserFile,
  'user-files/delete-user-file': rmUserFiles_DeleteUserFile,
  'user-files/get-user-family-member-files': rmUserFiles_GetUserFamilyMemberFiles,
  'user-files/create-user-file': rmUserFiles_CreateUserFile,
  'user-files/get-user-file-download-url': rmUserFiles_GetUserFileDownloadUrl,
  'user-files/get-user-file-cases': rmUserFiles_GetUserFileCases,
  'user-files/update-generated-file': rmUserFiles_UpdateGeneratedFile,
  'user-files/get-generated-file-download-url': rmUserFiles_GetGeneratedFileDownloadUrl,

  // Users
  'users/get-user-by-token': rmUsers_GetUserByToken,
  'users/update-user': rmUsers_UpdateUser,
  'users/delete-user': rmUsers_DeleteUser,
  'users/get-user-activity': rmUsers_GetUserActivity,
  'users/create-user': rmUsers_CreateUser,

  // NYCID
  // 'nycid/token': rmNycid_Token,
  // 'nycid/userinfo': rmNycid_UserInfo,

  // Messaging
  'messaging/post-message-to-ws-connections': rmMessaging_PostMessageToConnections,

  // 404 - Not Found
  'not-found': lambdaRouteProxyPathNotFound,
};

export const handler = lambdaRouteProxyEntryHandler(config, routeModules);
