#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { appTags, buildConfig } from '../config';

const main = () => {
  const app = new cdk.App();
  const mainStack = new CdkStack(app, appTags.StackName, {
    env: {
      account: (process.env.AWS_ACCOUNT as string).replace(/\"/g, ''),
      region: process.env.AWS_DEFAULT_REGION,
    },
    description: appTags.Description,
    stackName: appTags.StackName,
    tags: { ...appTags },
    ...buildConfig,
    appMetadata: appTags,
  });
};

main();
