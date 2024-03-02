import { aws_lambda_nodejs as lambdaNode, aws_lambda as lambda, aws_ec2 as ec2, aws_iam as iam, aws_sqs as sqs, Duration, custom_resources as customResources, CustomResource } from 'aws-cdk-lib';
import { HttpApi, HttpRoute, HttpRouteKey, HttpMethod, PayloadFormatVersion } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Construct } from 'constructs';
import { RouteConfig } from '@myfile/core-sdk';
import { ExtendedStackProps } from './stack-interfaces';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import path from 'path';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';

export interface PrismaMigrationLambdaProps extends ExtendedStackProps {
  name: string;
  ssmVpcId: string;
  iamPolicy?: iam.PolicyStatement;
  envVars: { [key: string]: string };
  noBundlingNodeModules: Array<string>;
  lambdaMainHandlerPath: string;
  lambdaMemorySizeInMb: number;
  lambdaTimeoutInSeconds: number;
}

export class PrismaMigrationLambda extends Construct {
  public readonly lambdaPrismaMigrationsHandler: lambdaNode.NodejsFunction;
  public readonly response: string;

  constructor(scope: Construct, id: string, props: PrismaMigrationLambdaProps) {
    super(scope, id);

    // @ts-ignore
    const { awsRegion, deploymentTarget, envVars = {} } = props;

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });

    const lambdaPrismaMigrationsHandlerName = props.name;

    this.lambdaPrismaMigrationsHandler = new lambda.DockerImageFunction(this, `${lambdaPrismaMigrationsHandlerName}-${deploymentTarget}`, {
      code: lambda.DockerImageCode.fromImageAsset('./', {
        file: 'custom-resource.Dockerfile',
        buildArgs: {
          // git_commit: GIT_COMMIT,
          // git_branch: GIT_BRANCH,
          // aws_access_key_id: AWS_ACCESS_KEY_ID,
          // aws_secret_access_key: AWS_SECRET_ACCESS_KEY,
          // aws_session_token: AWS_SESSION_TOKEN,
        },
        platform: Platform.LINUX_AMD64,
        cmd: [ 'app/lambda-db-migrations.handler' ],
      }),
      functionName: `${lambdaPrismaMigrationsHandlerName}-${deploymentTarget}`,
      vpc,
      // vpcSubnets: {subnetType: ec2.SubnetType., onePerAz: true, availabilityZones: ['us-east-1c']},
      memorySize: props.lambdaMemorySizeInMb,
      timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
      environment: {
        ...props.envVars,
        TIMESTAMP: Date.now().toString(),
        PRISMA_CLI_BINARY_TARGETS: 'native,rhel-openssl-1.0.x',
        // PRISMA_SCHEMA_ENGINE_BINARY: './prisma/libquery_engine-rhel-openssl-1.0.x.so.node',
        // SQS_BROADCAST_MSG_QUEUE_URL: sqsBroadcastMessageQueue.queueUrl,
        // SQS_BROADCAST_MSG_QUEUE_NAME: sqsBroadcastMessageQueue.queueName,
      },
      logRetention: RetentionDays.ONE_WEEK,
    });

    // this.lambdaPrismaMigrationsHandler = new lambdaNode.NodejsFunction(
    //   this,
    //   `${lambdaPrismaMigrationsHandlerName}-${deploymentTarget}`,
    //   {
    //     runtime: Runtime.NODEJS_18_X,
    //     functionName: `${lambdaPrismaMigrationsHandlerName}-${deploymentTarget}`,
    //     entry: props.lambdaMainHandlerPath,
    //     vpc,
    //     // vpcSubnets: {subnetType: ec2.SubnetType., onePerAz: true, availabilityZones: ['us-east-1c']},
    //     memorySize: props.lambdaMemorySizeInMb,
    //     timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
    //     environment: {
    //       ...props.envVars,
    //       TIMESTAMP: Date.now().toString(),
    //       PRISMA_CLI_BINARY_TARGETS: 'native,rhel-openssl-1.0.x',
    //       PRISMA_SCHEMA_ENGINE_BINARY: './prisma/libquery_engine-rhel-openssl-1.0.x.so.node',
    //       // SQS_BROADCAST_MSG_QUEUE_URL: sqsBroadcastMessageQueue.queueUrl,
    //       // SQS_BROADCAST_MSG_QUEUE_NAME: sqsBroadcastMessageQueue.queueName,
    //     },
    //     logRetention: RetentionDays.ONE_WEEK,
    //     // bundling: {
    //     //   nodeModules: props.noBundlingNodeModules,
    //     // },
    //     bundling: {
    //       nodeModules: ['prisma', '@prisma/client', '@prisma/migrate'],
    //       commandHooks: {
    //         beforeBundling(inputDir: string, outputDir: string): string[] {
    //           return [];
    //         },
    //         beforeInstall(inputDir: string, outputDir: string) {
    //           return [`cp -R ./prisma ${outputDir}/`];
    //         },
    //         afterBundling(inputDir: string, outputDir: string): string[] {
    //           return [
    //             // `cd ${outputDir}`,
    //             `export PRISMA_SCHEMA_ENGINE_BINARY='${outputDir}/prisma/libquery_engine-rhel-openssl-1.0.x.so.node'`,
    //             `cp -R ${inputDir}/node_modules/prisma ${outputDir}/`,
    //             // `cp ${outputDir}/prisma/libquery_engine-rhel-openssl-1.0.x.so.node ${outputDir}/prisma/libquery_engine-rhel-openssl-1.0.x.so.node`,
    //             'npm i',
    //             `npx prisma generate`,
    //             // `rm -rf ${outputDir}/node_modules/@prisma/engines`,
    //             "find . -type f -name '*libquery_engine-darwin*' -exec rm {} +",
    //             // `find ${outputDir}/node_modules/prisma -type f -name \'*libquery_engine*\' -exec rm {} +`,
    //           ];
    //         },
    //       },
    //     },
    //   },
    // );

    // sqsBroadcastMessageQueue.grantSendMessages(this.lambdaProxyRouteEntryHandler);

    /*
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: ['lambda:InvokeFunction'],
    })
    */
    if (props.iamPolicy) {
      this.lambdaPrismaMigrationsHandler.addToRolePolicy(props.iamPolicy);
    }


    const provider = new customResources.Provider(this, 'Provider', {
      onEventHandler: this.lambdaPrismaMigrationsHandler,
      logRetention: RetentionDays.ONE_DAY,
    });

    const resource = new CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      properties: {
        TIMESTAMP: Date.now().toString(),
      },
    });

    this.response = resource.getAtt('Response').toString();

  }
}
