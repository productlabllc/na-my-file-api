import { EnvironmentVariable, getConfiguration, isProduction, requireConfiguration } from './config';
import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import { logger } from './logging';
import { getIntegrationType, IntegrationType } from './oauthIntegration';
import { signRequest } from './request-signer';
import createError from 'http-errors';

type UserInfo = {
  sub: string;
  email_verified: 'true' | 'false';
  given_name: string | undefined;
  family_name: string | undefined;
  dob: string | undefined;
  dhsCaseNumber: string | undefined;
  email: string;
  username: string;
};

let proxyOpts = undefined;
let proxyAgent: any = undefined;

const setProxyAgent = () => {
  const isProd = isProduction();
  const environment = getConfiguration(EnvironmentVariable.NODE_ENV);
  console.log(`isProd: ${isProd}`);
  console.log(`NODE_ENV: ${environment}`);
  if (isProd) {
    console.log(`Proxy: ${process.env.NYC_HTTPS_PROXY}`);
    proxyOpts = new URL(process.env.NYC_HTTPS_PROXY!);
    proxyOpts.username = 'nycoppcertcheck@doitt.nyc.gov';
    proxyOpts.password = 'cmMkFUHme#4';
    const proxyUrl = proxyOpts.toString();
    console.log(`proxy url: ${proxyUrl}`);
    proxyAgent = HttpsProxyAgent(proxyUrl);
  }
};

export const getUserInfo = async (token: string): Promise<UserInfo> => {
  setProxyAgent();
  const endpoint = requireConfiguration(EnvironmentVariable.USERINFO_ENDPOINT);
  const headers = {
    Authorization: token,
  };
  const signedUrl = signRequest('GET', endpoint, headers);
  const fetchOpts = {
    headers,
    agent: process.env.NODE_ENV === 'production' && proxyAgent ? proxyAgent : undefined,
  };

  console.log(`signed url: ${signedUrl}`);
  console.log(`fetch options: ${JSON.stringify(fetchOpts, null, 2)}`);

  const result = await fetch(signedUrl, fetchOpts);

  console.log(`--- oauth response ---\n${JSON.stringify(result, null, 2)}`);

  if (!result.ok) {
    // generally this error is from a bad token, but if we're not sure we'll log it
    const text = await result.text();
    if (!text.includes('cpui.oauth.unknownOauthAccessToken')) {
      // doesn't look like a bad token error
      logger.error(new Error(`User info could not be fetched: ${result.status} ${text}`));
    }
    throw new createError.Unauthorized();
  }
  return mapResultToUserData(await result.json());
};

const mapResultToUserData = (data: any): UserInfo => {
  const integrationType = getIntegrationType();
  switch (integrationType) {
    case IntegrationType.NYCID_OAUTH:
      const {
        email,
        id: username,
        validated: email_verified,
        firstName: given_name,
        lastName: family_name,
        dhsCaseNumber,
        dob,
      } = data;
      return {
        email,
        email_verified,
        sub: username,
        username,
        family_name,
        given_name,
        dob,
        dhsCaseNumber,
      };
    default:
      return data as UserInfo;
  }
};
