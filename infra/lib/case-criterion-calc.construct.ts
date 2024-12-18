import {
  aws_lambda_nodejs as lambdaNodeJS,
  aws_sqs as sqs,
  aws_iam as iam,
  aws_ec2 as ec2,
  Duration,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ExtendedStackProps } from './stack-interfaces';
import { Architecture, Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { join } from 'path';

interface LambdaCriterionCalcProps extends ExtendedStackProps {
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
  criterionCalcQue: sqs.IQueue;
}
export class LambdaCriterionCalcConstruct extends Construct {
  public readonly criterionCalcFunction: lambdaNodeJS.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaCriterionCalcProps) {
    super(scope, id);

    const { deploymentTarget, criterionCalcQue } = props;

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });

    this.criterionCalcFunction = new lambdaNodeJS.NodejsFunction(this, props.name, {
      functionName: `${props.name}-${deploymentTarget}`,
      entry: props.lambdaMainHandlerPath,
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_18_X,
      vpc,
      memorySize: props.lambdaMemorySizeInMb,
      timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
      logRetention: RetentionDays.ONE_WEEK,
      events: [new SqsEventSource(criterionCalcQue)],
      // vpc,
      environment: {
        ...props.envVars,
        TIMESTAMP: Date.now().toString(),
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
              // `npx prisma generate`,
              `./node_modules/.bin/prisma generate`,
              `rm -rf ${outputDir}/node_modules/@prisma/engines`,
              "find . -type f -name '*libquery_engine-darwin*' -exec rm {} +",
              `find ${outputDir}/node_modules/prisma -type f -name \'*libquery_engine*\' -exec rm {} +`,
            ];
          },
        },
      },
    });

    criterionCalcQue.grantConsumeMessages(this.criterionCalcFunction);

    this.criterionCalcFunction.addToRolePolicy(
      new PolicyStatement({
        actions: ['sqs:DeleteMessageBatch'],
        resources: [criterionCalcQue.queueArn],
      }),
    );
  }
}
