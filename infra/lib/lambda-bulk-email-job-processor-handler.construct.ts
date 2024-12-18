import {
  aws_lambda_nodejs as lambdaNodeJS,
  aws_sqs as sqs,
  aws_iam as iam,
  aws_ec2 as ec2,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ExtendedStackProps } from './stack-interfaces';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

interface BulkEmailJobProcessorHandlerConstructProps extends ExtendedStackProps {
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
  sqsSendEmailRequestQueue: sqs.IQueue;
}
export class BulkEmailJobProcessorHandlerConstruct extends Construct {
  public readonly lambdaHandler: lambdaNodeJS.NodejsFunction;

  constructor(scope: Construct, id: string, props: BulkEmailJobProcessorHandlerConstructProps) {
    super(scope, id);

    const { deploymentTarget } = props;

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });

    this.lambdaHandler = new lambdaNodeJS.NodejsFunction(this, props.name, {
      functionName: `${props.name}-${deploymentTarget}`,
      entry: props.lambdaMainHandlerPath,
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_18_X,
      vpc,
      memorySize: props.lambdaMemorySizeInMb,
      timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
      logRetention: RetentionDays.ONE_WEEK,

      // vpc,
      environment: {
        ...props.envVars,
        TIMESTAMP: Date.now().toString(),
        SEND_EMAIL_QUEUE_URL: props.sqsSendEmailRequestQueue.queueUrl,
        PUBLIC_ASSET_HOST: 'https://myfile.us.gov',
        SEND_EMAIL_QUEUE_NAME: props.sqsSendEmailRequestQueue.queueName,
      },
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
      this.lambdaHandler.addToRolePolicy(props.iamPolicy);
    }

    props.sqsSendEmailRequestQueue.grantSendMessages(this.lambdaHandler);
  }
}
