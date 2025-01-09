import {
  Stack,
  aws_ssm as ssm,
  aws_secretsmanager as secretsmanager,
  aws_dynamodb as ddb,
  aws_sqs as sqs,
  aws_s3 as s3,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config as routesConfig } from '../../src/routes-config';
import { ExtendedStackProps } from './stack-interfaces';
import { LambdaProxyApi } from './lambda-proxy-api.construct';
import { LambdaActivityLogConstruct } from './lambda-activity-log.construct';
import { LambdaS3FileUploadTriggerHandlerConstruct } from './lambda-s3-file-upload-trigger-handler.construct';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { LambdaPdfGeneratorConstruct } from './lambda-pdf-generator.construct';
import { LambdaCriterionCalcConstruct } from './case-criterion-calc.construct';
import { LambdaSendEmailRequestHandlerConstruct } from './lambda-send-email-request-handler.construct';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { BulkEmailJobProcessorHandlerConstruct } from './lambda-bulk-email-job-processor-handler.construct';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LambdaPostSendEmailCleanupHandlerConstruct } from './lambda-post-send-email-cleanup-handler.construct';

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

    // Create S3 bucket to shared among sub stacks
    const bucketName = CLIENT_FILE_BUCKET_NAME;

    const documentsBucket = new s3.Bucket(this, getFormattedResourceName('documents-bucket'), {
      bucketName: bucketName,
      versioned: false,
      removalPolicy: deploymentTarget === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    const corsRule: s3.CorsRule = {
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
      allowedOrigins: ['*'],

      // the properties below are optional
      allowedHeaders: ['*'],
      exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2'],
      id: `${bucketName}-cors-rule`,
      maxAge: 123,
    };

    documentsBucket.addCorsRule(corsRule);

    const postgresSecret = secretsmanager.Secret.fromSecretCompleteArn(this, 'postgres-secret', postgresSecretArn);

    const sqsBroadcastMessageQueue = sqs.Queue.fromQueueArn(
      this,
      'queue-broadcast-message',
      SQS_BROADCAST_MSG_QUEUEARN,
    );
    const sqsActivityLogQueue = new sqs.Queue(this, getFormattedResourceName('sqs-activity-log-queue'), {
      queueName: getFormattedResourceName('sqs-activity-log-queue'),
    });

    const deadLettersQueue = new Queue(this, getFormattedResourceName('dead-letters-queue'), {
      retentionPeriod: Duration.days(10),
      fifo: true,
    });

    const documentGeneratorQueue = new Queue(this, getFormattedResourceName('document-generator-queue'), {
      fifo: true,
      contentBasedDeduplication: true,
      retentionPeriod: Duration.days(10),
      deadLetterQueue: {
        queue: deadLettersQueue,
        maxReceiveCount: 50,
      },
    });

    const caseCriterionCalcQueue = new Queue(this, getFormattedResourceName('case-criterion-calc-queue'), {
      fifo: true,
      contentBasedDeduplication: true,
      retentionPeriod: Duration.days(10),
      deadLetterQueue: {
        queue: deadLettersQueue,
        maxReceiveCount: 50,
      },
    });

    const sendEmailQueue = new Queue(this, getFormattedResourceName('send-email-queue'), {
      fifo: true,
      contentBasedDeduplication: true,
      retentionPeriod: Duration.days(10),
      deadLetterQueue: {
        queue: deadLettersQueue,
        maxReceiveCount: 50,
      },
    });

    const postSendEmailCleanupQueue = new Queue(this, getFormattedResourceName('post-send-email-cleanup-queue'), {
      fifo: true,
      contentBasedDeduplication: true,
      retentionPeriod: Duration.days(10),
      deadLetterQueue: {
        queue: deadLettersQueue,
        maxReceiveCount: 50,
      },
    });

    // API Stack
    const api = new LambdaProxyApi(this, `api${resourceSuffix}`, {
      ...props,
      envVars: {
        DB_CREDS: postgresSecret.secretValue.toString(),
        REGION: this.region,
        CLIENT_FILE_BUCKET_NAME,
        DOCUMENT_GENERATOR_QUEUE_URL: documentGeneratorQueue.queueUrl,
        CASE_CRITERION_CALC_QUEUE_URL: caseCriterionCalcQueue.queueUrl,
        NYC_HTTPS_PROXY_INFO,
        SEND_EMAIL_QUEUE_URL: sendEmailQueue.queueUrl,
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
      caseCriterionCalcQueue,
      pdfGeneratorQueue: documentGeneratorQueue,
      documentsBucket,
      sendEmailQueue,
    });

    const caseCriterionCalcFunc = new LambdaCriterionCalcConstruct(this, `case-criterion-calc-${resourceSuffix}`, {
      ...props,
      envVars: {
        DB_CREDS: postgresSecret.secretValue.toString(),
        REGION: this.region,
        NYC_HTTPS_PROXY_INFO,
      },
      name: 'case-criterion-calc-lambda-handler',
      ssmHttpApiId: httpApiId,
      ssmVpcId: vpcId,
      lambdaMainHandlerPath: 'src/lambdas/case-criterion-fulfillment-calculator.handler.ts',
      lambdaMemorySizeInMb: 512,
      noBundlingNodeModules: [],
      criterionCalcQue: caseCriterionCalcQueue,
      lambdaTimeoutInSeconds: 5,
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

    // S3 File Upload Trigger Handler
    const s3FileUploadTriggerHandler = new LambdaS3FileUploadTriggerHandlerConstruct(
      this,
      `s3-file-upload-trigger-handler${resourceSuffix}`,
      {
        ...props,
        envVars: {
          DB_CREDS: postgresSecret.secretValue.toString(),
          REGION: this.region,
          CLIENT_FILE_BUCKET_NAME,
          DOCUMENT_GENERATOR_QUEUE_URL: documentGeneratorQueue.queueUrl,
        },
        name: 's3-file-upload-trigger-handler',
        ssmHttpApiId: httpApiId,
        pdfGeneratorQueue: documentGeneratorQueue,
        ssmVpcId: vpcId,
        lambdaMainHandlerPath: 'src/lambdas/s3-file-upload-trigger.handler.ts',
        lambdaMemorySizeInMb: 512,
        lambdaTimeoutInSeconds: 10 * 60,
        noBundlingNodeModules: [
          // 'prisma',
          // '@prisma/client',
        ],
        documentsBucket,
      },
    );

    const pdfGeneratorHandler = new LambdaPdfGeneratorConstruct(this, `pdf-generator-handler${resourceSuffix}`, {
      ...props,
      envVars: {
        DB_CREDS: postgresSecret.secretValue.toString(),
        REGION: this.region,
        CLIENT_FILE_BUCKET_NAME,
        DOCUMENT_GENERATOR_QUEUE_URL: documentGeneratorQueue.queueUrl,
      },
      name: 'pdf-generator-handler',
      ssmHttpApiId: httpApiId,
      ssmVpcId: vpcId,
      lambdaMainHandlerPath: 'src/lambdas/generate-pdf-document.handler.ts',
      lambdaMemorySizeInMb: 512,
      lambdaTimeoutInSeconds: 30,
      pdfGeneratorQueue: documentGeneratorQueue,
      noBundlingNodeModules: [
        // 'prisma',
        // '@prisma/client',
      ],
      documentsBucket,
    });

    const sendEmailHandler = new LambdaSendEmailRequestHandlerConstruct(this, `send-email-handler${resourceSuffix}`, {
      ...props,
      envVars: {
        REGION: this.region,
        SEND_EMAIL_QUEUE_URL: sendEmailQueue.queueUrl,
        POST_SEND_EMAIL_CLEANUP_QUEUE_URL: postSendEmailCleanupQueue.queueUrl,
      },
      name: 'send-email-handler',
      ssmHttpApiId: httpApiId,
      ssmVpcId: vpcId,
      lambdaMainHandlerPath: 'src/lambdas/email-handler/send-email.handler.ts',
      lambdaMemorySizeInMb: 512,
      lambdaTimeoutInSeconds: 30,
      sqsSendEmailRequestQueue: sendEmailQueue,
      sqsPostSendEmailCleanupQueue: postSendEmailCleanupQueue,
      noBundlingNodeModules: [
        // 'prisma',
        // '@prisma/client',
      ],
      iamPolicy: new PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    });

    // Bulk Email Job Processor
    const bulkSessionEmailJobProcessor = new BulkEmailJobProcessorHandlerConstruct(
      this,
      `bulk-email-job-processor-handler${resourceSuffix}`,
      {
        ...props,
        envVars: {
          DB_CREDS: postgresSecret.secretValue.toString(),
          REGION: this.region,
        },
        name: 'bulk-email-job-processor-handler',
        ssmHttpApiId: httpApiId,
        ssmVpcId: vpcId,
        lambdaMainHandlerPath: 'src/lambdas/bulk-email-session-job-processor.handler.ts',
        lambdaMemorySizeInMb: 512,
        lambdaTimeoutInSeconds: 30,
        sqsSendEmailRequestQueue: sendEmailQueue,
        noBundlingNodeModules: [
          // 'prisma',
          // '@prisma/client',
        ],
      },
    );

    const timer = new Rule(this, `eventbridge-timer-bulkemailjob${resourceSuffix}`, {
      enabled: true,
      ruleName: `eventbridge-timer-bulkemailjob${resourceSuffix}`,
      description: 'This is the interval timer that kicks off the bulk/session email job processor lambda.',
      schedule: deploymentTarget === 'dev' ? Schedule.rate(Duration.minutes(3)) : Schedule.rate(Duration.minutes(30)),
      targets: [new LambdaFunction(bulkSessionEmailJobProcessor.lambdaHandler)],
    });

    const postSendEmailCleanupHandler = new LambdaPostSendEmailCleanupHandlerConstruct(
      this,
      `post-send-email-cleanup-handler${resourceSuffix}`,
      {
        ...props,
        envVars: {
          DB_CREDS: postgresSecret.secretValue.toString(),
          REGION: this.region,
        },
        name: 'post-send-email-cleanup-handler',
        ssmHttpApiId: httpApiId,
        ssmVpcId: vpcId,
        lambdaMainHandlerPath: 'src/lambdas/post-send-email-cleanup.handler.ts',
        lambdaMemorySizeInMb: 512,
        lambdaTimeoutInSeconds: 30,
        sqsPostSendEmailCleanupQueue: postSendEmailCleanupQueue,
        noBundlingNodeModules: [
          // 'prisma',
          // '@prisma/client',
        ],
      },
    );
  }
}
