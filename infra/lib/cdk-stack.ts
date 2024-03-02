import { Stack, aws_ssm as ssm, aws_secretsmanager as secretsmanager, aws_dynamodb as ddb } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config as routesConfig } from '../../src/routes-config';
import { ExtendedStackProps } from './stack-interfaces';
import { LambdaProxyApi } from './lambda-proxy-api.construct';
import { PrismaMigrationLambda } from './prisma-migration.resource';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: ExtendedStackProps) {
    super(scope, id, props);

    // Setup
    const { deploymentTarget, awsRegion, appMetadata } = props;
    const orgNameAbbv = appMetadata.OrgNameAbbv.replace(/[ \.]/g, '-');
    const resourceSuffix = `-${orgNameAbbv}-${deploymentTarget}`;
    const {
      EXISTING_VPC_ID: vpcId = '',
      EXISTING_HTTP_API_ID: httpApiId = '',
      POSTGRES_SECRET_ARN: postgresSecretArn = '',
      SQS_BROADCAST_MSG_QUEUEARN = '',
      CLIENT_FILE_BUCKET_NAME = '',
    } = process.env;

    const postgresSecret = secretsmanager.Secret.fromSecretCompleteArn(this, 'postgres-secret', postgresSecretArn);

    // Prisma DB Migration
    const prismaDbMigration = new PrismaMigrationLambda(this, `prisma-db-migrator${resourceSuffix}`, {
      appMetadata,
      awsRegion,
      deploymentTarget,
      envVars: {
        DB_CREDS: postgresSecret.secretValue.toString(),
        REGION: this.region,
      },
      name: 'prisma-db-migration-custom-resource-lambda',
      ssmVpcId: vpcId,
      lambdaMainHandlerPath: 'src/lambda-db-migrations.ts',
      lambdaMemorySizeInMb: 512,
      lambdaTimeoutInSeconds: 60*5,
      noBundlingNodeModules: [],
    });

    // API Stack
    const api = new LambdaProxyApi(this, `api${resourceSuffix}`, {
      appMetadata,
      awsRegion,
      deploymentTarget,
      envVars: {
        DB_CREDS: postgresSecret.secretValue.toString(),
        REGION: this.region,
        CLIENT_FILE_BUCKET_NAME,
      },
      name: 'core-api-lambda-handler',
      routeConfig: routesConfig,
      ssmHttpApiId: httpApiId,
      ssmVpcId: vpcId,
      lambdaMainHandlerPath: 'src/lambda-proxy.ts',
      lambdaMemorySizeInMb: 512,
      lambdaTimeoutInSeconds: 5,
      noBundlingNodeModules: [
        // 'prisma',
        // '@prisma/client',
      ],
      sqsBroadcastMessageQueueArn: SQS_BROADCAST_MSG_QUEUEARN,
    });
  }
}
