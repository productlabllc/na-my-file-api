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
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { InterfaceVpcEndpointAwsService } from 'aws-cdk-lib/aws-ec2';

interface SendEmailRequestHandlerConstructProps extends ExtendedStackProps {
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
  sqsPostSendEmailCleanupQueue: sqs.IQueue;
}
export class LambdaSendEmailRequestHandlerConstruct extends Construct {
  public readonly lambdaHandler: lambdaNodeJS.NodejsFunction;

  constructor(scope: Construct, id: string, props: SendEmailRequestHandlerConstructProps) {
    super(scope, id);

    const { deploymentTarget, sqsSendEmailRequestQueue: sqsActivityLogQueue, getFormattedResourceName } = props;

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });
    // const sesVpcEndpointSecurityGroup = new ec2.SecurityGroup(this, getFormattedResourceName('sg-ses-vpc-endpoint'), {
    //     description: `SES VPC endpoint security group`,
    //     vpc,
    //   }
    // );
    // vpc.addInterfaceEndpoint(`my-ses-access`, {
    //   service: new InterfaceVpcEndpointAwsService('email-smtp'),
    //   securityGroups: [sesVpcEndpointSecurityGroup],
    // });

    this.lambdaHandler = new lambdaNodeJS.NodejsFunction(this, props.name, {
      functionName: `${props.name}-${deploymentTarget}`,
      entry: props.lambdaMainHandlerPath,
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_18_X,
      // vpc,
      memorySize: props.lambdaMemorySizeInMb,
      timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
      logRetention: RetentionDays.ONE_WEEK,

      // vpc,
      environment: {
        ...props.envVars,
        TIMESTAMP: Date.now().toString(),
        SEND_EMAIL_QUEUE_URL: props.sqsSendEmailRequestQueue.queueUrl,
        SEND_EMAIL_QUEUE_NAME: props.sqsSendEmailRequestQueue.queueName,
      },
      events: [new SqsEventSource(props.sqsSendEmailRequestQueue)],
      bundling: {
        nodeModules: ['prisma', '@prisma/client'],
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [`cp -R ${inputDir}/src/lambdas/email-handler/templates ${outputDir}/templates`];
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

    // this.lambdaHandler.connections.allowTo(sesVpcEndpointSecurityGroup, ec2.Port.allTcp());

    if (props.iamPolicy) {
      this.lambdaHandler.addToRolePolicy(props.iamPolicy);
    }

    props.sqsSendEmailRequestQueue.grantConsumeMessages(this.lambdaHandler);
    props.sqsPostSendEmailCleanupQueue.grantSendMessages(this.lambdaHandler);
  }
}
