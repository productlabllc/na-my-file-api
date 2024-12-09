import QueryString from 'qs';
import { routesBaseUrlPath } from '../lib/utils';
import { config, config as routesConfig } from '../routes-config';

interface Params {
  path: string;
  method: string;
  queryStringParams: any;
  headers: any;
  body: any;
  isBase64Encoded: boolean;
}

const defaultHeaders = {} as any;
export default function formulateApiEvent({
  path,
  method,
  queryStringParams,
  headers = defaultHeaders,
  body,
  isBase64Encoded,
}: Params) {
  const { authorization, origin, referer, ...restHeaders } = headers;

  function mapPathToRoute(incomingPath: string) {
    const dynamicPathRegex = /{(\w+)}/g;
    method = method.toUpperCase();
    path = path.replace(routesBaseUrlPath, '');

    for (let route of routesConfig.routes) {
      const test = route.path.match(dynamicPathRegex);

      const params = {} as Record<string, string>;

      if (test) {
        const routeParts = route.path.split('/');
        const pathParts = incomingPath.split('/');

        if (routeParts.length !== pathParts.length) {
          continue;
        }

        const matches = routeParts.every((part: string, index: number) => {
          if (dynamicPathRegex.test(part)) {
            const paramKey = part.replace(dynamicPathRegex, '$1');
            params[paramKey] = pathParts[index];
            return true; // dynamic part, assume it matches
          }
          return part === pathParts[index];
        });

        if (matches) {
          return { path: route.path, params };
        }
      }
    }

    console.warn(`No dynamic route found for path: ${path}; treating it as static path`);

    return { path }; // or throw an error
  }

  const pathMap = mapPathToRoute(path);

  const routeKey = `${method} ${pathMap.path}`;
  const routeConfig = config.routes.find(
    ele => ele.path === pathMap.path && method.toLowerCase() === ele.method.toLowerCase(),
  );

  console.warn('\n\n Route config is: ', routeConfig, pathMap.params, '\n\n');

  if (!routeConfig) {
    console.warn('\n\n Route config is: ', config.routes, '\n\n');
    throw new Error(`Route not found for path: ${path} \n\n`);
  }

  return {
    version: '2.0',
    routeKey,
    rawPath: path,
    body: JSON.stringify(body),
    rawQueryString: QueryString.stringify(queryStringParams),
    headers: {
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9',
      authorization,
      'content-length': '0',
      'content-type': 'application/json',
      host: '4xgggck3cj.execute-api.us-east-1.amazonaws.com',
      origin,
      referer,
      'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'x-amzn-trace-id': 'Root=1-656b5643-264bb5c178e50b4e262c083e',
      'x-forwarded-for': '108.50.153.218',
      'x-forwarded-port': '443',
      'x-forwarded-proto': 'https',
      ...restHeaders,
    },
    queryStringParameters: queryStringParams,
    requestContext: {
      accountId: '044333267276',
      apiId: '4xgggck3cj',
      domainName: '4xgggck3cj.execute-api.us-east-1.amazonaws.com',
      domainPrefix: '4xgggck3cj',
      http: {
        method,
        path,
        protocol: 'HTTP/1.1',
        sourceIp: '108.50.153.218',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      },
      requestId: 'PUpqqgoMoAMEPOg=',
      routeKey,
      stage: '$default',
      time: '02/Dec/2023:16:07:31 +0000',
      timeEpoch: 1701533251918,
    },
    pathParameters: pathMap.params,
    isBase64Encoded,
  };
}
