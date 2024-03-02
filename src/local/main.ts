import express from 'express';
import { handler } from '../lambda-proxy';
import formulateApiEvent from './formulate-api-event';

import 'dotenv/config';

function isBase64Encoded(str: string): boolean {
  try {
    // Check if there are any non-base64 characters
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (err) {
    return false;
  }
}

export function bootstrap() {
  const app = express();
  app.use(express.json()); // <==== parse request body as JSON

  app.all('*', async (req, res) => {
    console.warn('\n\nrequest body is: ', req.body);
    try {
      const apiEvent = formulateApiEvent({
        path: req.path,
        method: req.method,
        queryStringParams: req.query,
        headers: req.headers,
        body: req.body,
        isBase64Encoded: isBase64Encoded(req.body),
      });

      const response = await handler(apiEvent);

      res.send(response);
    } catch (err: any) {
      res.status(404);
      res.json({ error: err.message });
    }
  });

  app.listen(process.env.PORT, () => {
    console.log('Local server running at: ', process.env.PORT);
  });
}

bootstrap();
