// import { Migrate } from '@prisma/migrate';
import { getConnectionString } from './lib/db';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { CdkCustomResourceEvent, CdkCustomResourceResponse } from 'aws-lambda';
import * as path from 'path';


type EventHandler = (event: CdkCustomResourceEvent) => Promise<CdkCustomResourceResponse | undefined>

async function* iterateAttempts(maxAttempt: number, intervalMs: number) {
  for (let attempt = 0; attempt < maxAttempt; attempt++) {
    if (attempt > 0) {
      console.info(`Retrying after ${intervalMs}ms`)
      await sleep(intervalMs);
    }
    yield attempt;
  }
  throw new Error('Maximum attempts reached.')
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getPrismaErrorCode = (e: any) => e?.code ?? e?.errorCode;

const spawnChild = async (command: string, args: readonly string[]) => {
  const child = spawn(command, args, {
    env: {
      ...process.env,
    }
  });

  let data = '';
  for await (const chunk of child.stdout) {
    console.log('stdout chunk: ' + chunk);
    data += chunk;
  }
  let error = '';
  for await (const chunk of child.stderr) {
    console.error('stderr chunk: ' + chunk);
    error += chunk;
  }
  const exitCode = await new Promise((resolve, reject) => {
    child.on('close', resolve);
  });

  if (exitCode) {
    throw new Error(`subprocess error exit ${exitCode}, ${error}`);
  }
  return data;
}

export const handler: EventHandler = async (event: CdkCustomResourceEvent) => {

  const response: CdkCustomResourceResponse = {
    PhysicalResourceId: 'migrator-custom-resource',
    Status: 'SUCCESS',
  };
  const ls = await fs.readdir(__dirname);
  ls.forEach(entry => console.log(entry));

  if (event.RequestType == 'Delete') {
    // skip delete events
    console.log('Skipping delete event.')
  } else if (['Create', 'Update'].includes(event.RequestType)) {
    console.log('Attempting prisma db migrations...');
    process.env.DATABASE_URL = getConnectionString();
    console.log(`ConnectionString: ${process.env.DATABASE_URL}`);

    // for await (const attempt of iterateAttempts(5, 5000)) {
    // }

    try {
      // const migrate = new Migrate();
      // migrate.migrationsDirectoryPath = path.join(process.cwd(), './prisma/migrations');
      // const migrationResults = await migrate.applyMigrations();
      // console.log(JSON.stringify(migrationResults, null, 2));
      // const cmdResponse = await spawnChild(`${path.join(__dirname, 'node_modules/prisma/build/index.js')}`, ['migrate', 'deploy', '--auto-approve', '--experimental']);
      // const cmdResponse = await spawnChild('npx', ['prisma', 'migrate', 'deploy', '--auto-approve', '--experimental']);
      const logContents = await fs.readFile(path.join(process.cwd(), './migrate-log.txt'))
      console.log(`LOG:
    -------------------------------
    ${logContents.toString()}
    `);
    } catch (e: any) {
      console.error(e);
      const code = getPrismaErrorCode(e);
      console.error(code);
      response.Data = e;
      // if (code !== 'P1001') {
      //   throw e;
      // }
    }
  }

  return response;
};

