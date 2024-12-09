#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { appTags, buildConfig } from '../config';
import { ExtendedStackProps } from '../lib/stack-interfaces';

const main = () => {
  const app = new cdk.App();

  // Setup
  const { deploymentTarget, awsRegion } = buildConfig;
  const orgNameAbbv = appTags.OrgNameAbbv.replace(/[ \.]/g, '-');
  const fqdn = process.env.FQDN!;
  const resourceSuffix = `-${orgNameAbbv}-${deploymentTarget}`;
  const getFormattedResourceName = (name: string) => `${appTags.AppName}-${name}-${deploymentTarget}`.toLowerCase();

  const {
    EXISTING_HOSTED_ZONE_ID: existingHostedZoneId,
    EXISTING_HOSTED_ZONE_NAME: existingHostedZoneName,
    EXISTING_WILDCARD_CERT_ARN: existingWildcardCertArn,
    EXISTING_VPC_ID: existingVpcId,
    AVAILABILITY_ZONES,
    VPC_SUBNETS: existingVpcSubnets,
    VPC_ROUTE_TABLES: existingRouteTables,
    EXISTING_DB_SUBNET_GROUP_IDS: existingDbSecurityGroupIds,
  } = process.env;

  const extendedStackProps: ExtendedStackProps = {
    appMetadata: appTags,
    resourceSuffix,
    fqdn,
    orgNameAbbv,
    createNewVpc: false,
    createNewHostedZone: false,
    existingHostedZoneId,
    existingHostedZoneName,
    existingWildcardCertArn,
    existingVpcId,
    vpcAvailabilityZones: (AVAILABILITY_ZONES || '').split(','),
    existingVpcSubnets,
    existingRouteTables,
    existingDbSecurityGroupIds,
    getFormattedResourceName,
    awsRegion,
    deploymentTarget,
  };

  const mainStack = new CdkStack(app, appTags.StackName, {
    env: {
      account: (process.env.AWS_ACCOUNT as string).replace(/\"/g, ''),
      region: process.env.AWS_DEFAULT_REGION,
    },
    description: appTags.Description,
    stackName: appTags.StackName,
    tags: { ...appTags },
    ...buildConfig,
    ...extendedStackProps,
  });
};

main();
