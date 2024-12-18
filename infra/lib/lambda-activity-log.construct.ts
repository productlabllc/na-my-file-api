import {
  NestedStack,
  aws_lambda_nodejs as lambdaNodeJS,
  aws_sqs as sqs,
  aws_iam as iam,
  aws_ec2 as ec2,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ExtendedStackProps } from './stack-interfaces';
import { Architecture, LoggingFormat, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

interface ActivityLogConstructProps extends ExtendedStackProps {
  // Add properties here
  name: string;
  ssmVpcId: string;
  ssmHttpApiId: string;
  iamPolicy?: iam.PolicyStatement;
  envVars: { [key: string]: string };
  noBundlingNodeModules: Array<string>;
  lambdaMainHandlerPath: string;
  lambdaMemorySizeInMb: number;
  lambdaTimeoutInSeconds: number;
  sqsActivityLogQueue: sqs.IQueue;
}
export class LambdaActivityLogConstruct extends Construct {
  public readonly activityLogHandler: lambdaNodeJS.NodejsFunction;

  constructor(scope: Construct, id: string, props: ActivityLogConstructProps) {
    super(scope, id);

    const { deploymentTarget, sqsActivityLogQueue } = props;

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });

    this.activityLogHandler = new lambdaNodeJS.NodejsFunction(this, props.name, {
      functionName: `${props.name}-${deploymentTarget}`,
      entry: props.lambdaMainHandlerPath,
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_18_X,
      vpc,
      memorySize: props.lambdaMemorySizeInMb,
      timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
      loggingFormat: LoggingFormat.JSON,
      logRetention: RetentionDays.ONE_DAY,

      // vpc,
      environment: {
        ...props.envVars,
        TIMESTAMP: Date.now().toString(),
        SQS_ACTIVITY_LOG_QUEUE_URL: props.sqsActivityLogQueue.queueUrl,
        SQS_ACTIVITY_LOG_QUEUE_NAME: props.sqsActivityLogQueue.queueName,
      },
      events: [new SqsEventSource(sqsActivityLogQueue)],
      bundling: {
        nodeModules: ['prisma', '@prisma/client'],
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          beforeInstall(inputDir: string, outputDir: string) {
            return [`cp -R ./prisma ${outputDir}/`];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [
              // `cd ${outputDir}`,
              // 'npm ci',
              // `cp -R ${inputDir}/node_modules/prisma ${outputDir}/`,
              `./node_modules/.bin/prisma generate`,
              `rm -rf ${outputDir}/node_modules/@prisma/engines`,
              "find . -type f -name '*libquery_engine-darwin*' -exec rm {} +",
              `find ${outputDir}/node_modules/prisma -type f -name \'*libquery_engine*\' -exec rm {} +`,
            ];
          },
        },
      },
    });

    if (props.iamPolicy) {
      this.activityLogHandler.addToRolePolicy(props.iamPolicy);
    }

    sqsActivityLogQueue.grantConsumeMessages(this.activityLogHandler);
  }
}
