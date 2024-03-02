import { IncomingMessage } from 'http';
import { request } from 'https';

const httpsCall = (urlOptions: any, data = '') =>
  new Promise((resolve, reject) => {
    const req = request(urlOptions, (res: IncomingMessage) => {
      const chunks: Array<any> = [];

      res.on('data', chunk => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => {
        const { statusCode, headers } = res;
        const validResponse = statusCode && statusCode >= 200 && statusCode <= 299;
        const body = chunks.join('');

        if (validResponse) {
          console.log(`statusCode: ${statusCode}`);
          console.log(`headers: ${JSON.stringify(headers, null, 2)}`);
          resolve({ statusCode, headers, body });
        } else {
          reject(new Error(`Request failed. status: ${statusCode}, body: ${body}`));
        }
      });
    });

    req.on('error', (err: Error) => {
      console.log(`request error: ${JSON.stringify(err, null, 2)}`);
      reject(err);
    });
    req.write(data, 'binary');
    req.end();
  });

export default httpsCall;
