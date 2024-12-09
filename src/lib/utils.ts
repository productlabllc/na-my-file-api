import { Axios, AxiosProxyConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { join } from 'path';

export const routesBaseUrlPath = '';
export const routesSourceBaseDirectory = join(process.cwd(), 'src/routes');

export const parseJwt = (token: string) => {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(''),
  );

  return JSON.parse(jsonPayload);
};

// export const getAxiosProxyConfiguration = () => {
//   const { NYC_HTTPS_PROXY_INFO = '{}' } = process.env;
//   const { PROXY_HOST, PROXY_PORT, PROXY_PROTOCOL, PROXY_USERNAME, PROXY_PASSWORD } = JSON.parse(NYC_HTTPS_PROXY_INFO);
//   console.log(`Proxy Creds:
//   ${NYC_HTTPS_PROXY_INFO}`);
//   return {
//     host: PROXY_HOST,
//     port: Number(PROXY_PORT),
//     auth: {
//       username: PROXY_USERNAME,
//       password: PROXY_PASSWORD,
//     },
//     protocol: PROXY_PROTOCOL,
//   } as AxiosProxyConfig;
// };

export const setupAxiosLogging = (axios: Axios) => {
  axios.interceptors.request.use(
    x => {
      const headers = {
        ...x.headers.common,
        ...x.headers[x.method!],
        ...x.headers,
      };
      console.log(`Request Detail:
    ${JSON.stringify(x, null, 2)}`);

      return x;
    },
    error => {
      console.log(`Request Error:
    ${JSON.stringify(error, null, 2)}`);
      throw error;
    },
  );

  axios.interceptors.response.use(
    response => {
      const printable = `${new Date()} | Response: ${response.status} | ${JSON.stringify(response.data)}`;
      console.log(printable);
      return response;
    },
    error => {
      console.log(`Response Error:
    ${JSON.stringify(error, null, 2)}`);
      throw error;
    },
  );
};
