export enum EnvironmentVariablesEnum {
  NODE_ENV = 'NODE_ENV',
  DOCUMENTS_BUCKET = 'DOCUMENTS_BUCKET',
  CLIENT_FILE_BUCKET_NAME = 'CLIENT_FILE_BUCKET_NAME',
  USERINFO_ENDPOINT = 'USERINFO_ENDPOINT',
  WEB_APP_DOMAIN = 'WEB_APP_DOMAIN',
  EMAIL_SENDER = 'EMAIL_SENDER',
  AGENCY_EMAIL_DOMAINS_WHITELIST = 'AGENCY_EMAIL_DOMAINS_WHITELIST',
  CREATE_COLLECTION_ZIP_FUNCTION_NAME = 'CREATE_COLLECTION_ZIP_FUNCTION_NAME',
  ACTIVITY_RECORD_SQS_QUEUE_URL = 'ACTIVITY_RECORD_SQS_QUEUE_URL',
  ACTIVITY_CLOUDWATCH_LOG_GROUP = 'ACTIVITY_CLOUDWATCH_LOG_GROUP',
  EMAIL_PROCESSOR_SQS_QUEUE_URL = 'EMAIL_PROCESSOR_SQS_QUEUE_URL',
  SENTRY_DSN = 'SENTRY_DSN',
  ENVIRONMENT_NAME = 'ENVIRONMENT_NAME',
  AUTH_SIGNING_KEY = 'AUTH_SIGNING_KEY',
  AUTH_INTEGRATION_TYPE = 'AUTH_INTEGRATION_TYPE',
  AUTH_EMAIL_UNVERIFIED_REDIRECT = 'AUTH_EMAIL_UNVERIFIED_REDIRECT',
  CLIENT_WEB_APP_PARAMETER_PATH = 'CLIENT_WEB_APP_PARAMETER_PATH',
  QA_USER_EMAIL_LIST = 'QA_USER_EMAIL_LIST',
  SHARED_INBOX_CONFIG_QA = 'SHARED_INBOX_CONFIG_QA',
  SHARED_INBOX_CONFIG = 'SHARED_INBOX_CONFIG',
  MULTIPAGE_DOCUMENT_ASSEMBLY_PROCESSOR_SQS_QUEUE_URL = 'MULTIPAGE_DOCUMENT_ASSEMBLY_PROCESSOR_SQS_QUEUE_URL',
}

export const getEnvironmentVariable = (
  key: EnvironmentVariablesEnum,
  throwOnUndefined: boolean = false,
): string | undefined => {
  const result = process.env[key];
  if (!result && throwOnUndefined) {
    throw new Error(`Required environment variable '${key}' is null or undefined.`);
  }
  return result;
};

export const isProduction = () => getEnvironmentVariable(EnvironmentVariablesEnum.NODE_ENV) === 'production';
