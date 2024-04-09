import { Stack, aws_ssm as ssm, aws_secretsmanager as secretsmanager, aws_dynamodb as ddb, aws_sqs as sqs } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config as routesConfig } from '../../src/routes-config';
import { ExtendedStackProps } from './stack-interfaces';
import { LambdaProxyApi } from './lambda-proxy-api.construct';
import { LambdaActivityLogConstruct } from './lambda-activity-log.construct';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: ExtendedStackProps) {
    super(scope, id, props);

    // Setup
    const { deploymentTarget, awsRegion, appMetadata, getFormattedResourceName } = props;
    const orgNameAbbv = appMetadata.OrgNameAbbv.replace(/[ \.]/g, '-');
    const resourceSuffix = `-${orgNameAbbv}-${deploymentTarget}`;
    const {
      EXISTING_VPC_ID: vpcId = '',
      EXISTING_HTTP_API_ID: httpApiId = '',
      POSTGRES_SECRET_ARN: postgresSecretArn = '',
      SQS_BROADCAST_MSG_QUEUEARN = '',
      CLIENT_FILE_BUCKET_NAME = '',
      NYC_HTTPS_PROXY_INFO = '',
    } = process.env;

    const postgresSecret = secretsmanager.Secret.fromSecretCompleteArn(this, 'postgres-secret', postgresSecretArn);

    const sqsBroadcastMessageQueue = sqs.Queue.fromQueueArn(this, 'queue-broadcast-message', SQS_BROADCAST_MSG_QUEUEARN);
    const sqsActivityLogQueue = new sqs.Queue(this, getFormattedResourceName('sqs-activity-log-queue'), {
      queueName: getFormattedResourceName('sqs-activity-log-queue'),
    });

    // API Stack
    const api = new LambdaProxyApi(this, `api${resourceSuffix}`, {
      ...props,
      envVars: {
        DB_CREDS: postgresSecret.secretValue.toString(),
        REGION: this.region,
        CLIENT_FILE_BUCKET_NAME,
        NYC_HTTPS_PROXY_INFO,
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
      sqsBroadcastMessageQueue,
      sqsActivityLogQueue,
    });

    // Activity Log Stack
    const activityLog = new LambdaActivityLogConstruct(this, `activity-log${resourceSuffix}`, {
      ...props,
      envVars: {
        DB_CREDS: postgresSecret.secretValue.toString(),
        REGION: this.region,
      },
      name: 'activity-log-lambda-handler',
      ssmHttpApiId: httpApiId,
      ssmVpcId: vpcId,
      lambdaMainHandlerPath: 'src/lambdas/activity-log.handler.ts',
      lambdaMemorySizeInMb: 512,
      lambdaTimeoutInSeconds: 5,
      noBundlingNodeModules: [
        // 'prisma',
        // '@prisma/client',
      ],
      sqsActivityLogQueue,
    });
  }
}
