import { EnvironmentVariablesEnum, getEnvironmentVariable } from './environment';

export enum IntegrationType {
  OAUTH = 'OAUTH',
  NYCID_OAUTH = 'NYCID_OAUTH',
}

export const getIntegrationType = (): IntegrationType => {
  const sigType = getEnvironmentVariable(EnvironmentVariablesEnum.AUTH_INTEGRATION_TYPE, true);
  if (!sigType) {
    return IntegrationType.OAUTH;
  }
  return sigType as IntegrationType;
};

export const getUserIdClaimKey = (): string => {
  switch (getIntegrationType()) {
    case IntegrationType.NYCID_OAUTH:
      return 'GUID';
    default:
      return 'sub';
  }
};

export const getTokenTimestampClaimKey = (): string => {
  switch (getIntegrationType()) {
    case IntegrationType.NYCID_OAUTH:
      return 'exp';
    default:
      return 'iat';
  }
};
