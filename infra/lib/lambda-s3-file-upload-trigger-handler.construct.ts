import {
  NestedStack,
  aws_lambda_nodejs as lambdaNodeJS,
  aws_sqs as sqs,
  aws_iam as iam,
  aws_ec2 as ec2,
  Duration,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ExtendedStackProps } from './stack-interfaces';
import { Architecture, LoggingFormat, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { S3Prefix } from '../../src/lib/constants';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface S3FileUploadTriggerHandlerConstructProps extends ExtendedStackProps {
  name: string;
  ssmVpcId: string;
  ssmHttpApiId: string;
  iamPolicy?: iam.PolicyStatement;
  envVars: { [key: string]: string };
  noBundlingNodeModules: string[];
  lambdaMainHandlerPath: string;
  lambdaMemorySizeInMb: number;
  lambdaTimeoutInSeconds: number;
  documentsBucket: Bucket;
  pdfGeneratorQueue: sqs.IQueue;
}
export class LambdaS3FileUploadTriggerHandlerConstruct extends Construct {
  public readonly s3FileUploadHandler: lambdaNodeJS.NodejsFunction;

  constructor(scope: Construct, id: string, props: S3FileUploadTriggerHandlerConstructProps) {
    super(scope, id);

    const { deploymentTarget, pdfGeneratorQueue, documentsBucket } = props;

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });

    this.s3FileUploadHandler = new lambdaNodeJS.NodejsFunction(this, props.name, {
      functionName: `${props.name}-${deploymentTarget}`,
      entry: props.lambdaMainHandlerPath,
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_18_X,
      vpc,
      memorySize: props.lambdaMemorySizeInMb,
      timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
      loggingFormat: LoggingFormat.JSON,
      logRetention: RetentionDays.ONE_WEEK,

      // vpc,
      environment: {
        ...props.envVars,
        TIMESTAMP: Date.now().toString(),
        PRISMA_CLI_QUERY_ENGINE_TYPE: 'binary',
        PRISMA_BINARY_TARGET: 'rhel-openssl-1.0.x',
      },
      // reservedConcurrentExecutions: 1,
      bundling: {
        nodeModules: ['prisma', '@prisma/client'],
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [`cp ${inputDir}/prisma/schema.prisma ${outputDir}/schema.prisma`];
          },
          beforeInstall(inputDir: string, outputDir: string) {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [
              `cd ${outputDir}`,
              'npm install prisma@latest',
              'npm install @prisma/client@latest',
              'npx prisma generate --schema=./schema.prisma',
              'rm -rf node_modules/@prisma/engines-version',
              'rm -rf node_modules/@prisma/engines/introspection-engine*',
              'rm -rf node_modules/@prisma/engines/migration-engine*',
              'rm -rf node_modules/@prisma/engines/prisma-fmt*',
              'find . -type f -name "libquery_engine-*" ! -name "libquery_engine-rhel-*" -delete',
              'rm ./schema.prisma',
            ];
          },
        },
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        target: 'node18',
      },
    });

    this.s3FileUploadHandler.addEventSource(
      new S3EventSource(documentsBucket, {
        events: [EventType.OBJECT_CREATED],
        filters: [
          {
            prefix: S3Prefix.USER_FILES,
          },
        ],
      }),
    );

    this.s3FileUploadHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ['sqs:DeleteMessageBatch'],
        resources: [pdfGeneratorQueue.queueArn],
      }),
    );

    documentsBucket.grantReadWrite(this.s3FileUploadHandler);

    pdfGeneratorQueue.grantSendMessages(this.s3FileUploadHandler);
  }
}
