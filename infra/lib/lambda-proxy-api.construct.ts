import { aws_lambda_nodejs as lambda, aws_ec2 as ec2, aws_iam as iam, aws_sqs as sqs, Duration } from 'aws-cdk-lib';
import { HttpApi, HttpRoute, HttpRouteKey, HttpMethod, PayloadFormatVersion } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Construct } from 'constructs';
import { RouteConfig } from '@myfile/core-sdk';
import { ExtendedStackProps } from './stack-interfaces';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export interface LambdaProxyApiProps extends ExtendedStackProps {
  name: string;
  routeConfig: RouteConfig;
  ssmVpcId: string;
  ssmHttpApiId: string;
  iamPolicy?: iam.PolicyStatement;
  envVars: { [key: string]: string };
  noBundlingNodeModules: Array<string>;
  lambdaMainHandlerPath: string;
  lambdaMemorySizeInMb: number;
  lambdaTimeoutInSeconds: number;
  sqsBroadcastMessageQueueArn: string;
}

export class LambdaProxyApi extends Construct {
  public readonly lambdaProxyRouteEntryHandler: lambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaProxyApiProps) {
    super(scope, id);

    // @ts-ignore
    const { awsRegion, deploymentTarget, envVars = {} } = props;

    const httpApi = HttpApi.fromHttpApiAttributes(this, 'http-api', {
      httpApiId: props.ssmHttpApiId,
    });

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });

    // const sqsBroadcastMessageQueue = sqs.Queue.fromQueueArn(this, 'queue-broadcast-message', props.sqsBroadcastMessageQueueArn);

    const lambdaRouteProxyEntryHandlerName = props.name;
    this.lambdaProxyRouteEntryHandler = new lambda.NodejsFunction(
      this,
      `${lambdaRouteProxyEntryHandlerName}-${deploymentTarget}`,
      {
        runtime: Runtime.NODEJS_18_X,
        functionName: `${lambdaRouteProxyEntryHandlerName}-${deploymentTarget}`,
        entry: props.lambdaMainHandlerPath,
        vpc,
        // vpcSubnets: {subnetType: ec2.SubnetType., onePerAz: true, availabilityZones: ['us-east-1c']},
        memorySize: props.lambdaMemorySizeInMb,
        timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
        environment: {
          ...props.envVars,
          TIMESTAMP: Date.now().toString(),
          // SQS_BROADCAST_MSG_QUEUE_URL: sqsBroadcastMessageQueue.queueUrl,
          // SQS_BROADCAST_MSG_QUEUE_NAME: sqsBroadcastMessageQueue.queueName,
        },
        logRetention: RetentionDays.ONE_WEEK,
        // bundling: {
        //   nodeModules: props.noBundlingNodeModules,
        // },
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
                `npx prisma generate`,
                `rm -rf ${outputDir}/node_modules/@prisma/engines`,
                "find . -type f -name '*libquery_engine-darwin*' -exec rm {} +",
                `find ${outputDir}/node_modules/prisma -type f -name \'*libquery_engine*\' -exec rm {} +`,
              ];
            },
          },
        },
      },
    );

    // sqsBroadcastMessageQueue.grantSendMessages(this.lambdaProxyRouteEntryHandler);

    /*
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: ['lambda:InvokeFunction'],
    })
    */
    if (props.iamPolicy) {
      this.lambdaProxyRouteEntryHandler.addToRolePolicy(props.iamPolicy);
    }

    /* Configure Routes */

    console.log(`ROUTE CONFIG:
    ${JSON.stringify(props.routeConfig.routes)}
    `);

    props.routeConfig.routes.forEach(({ method, path }) => {
      new HttpRoute(this, `http-route-${method}-${path}`, {
        httpApi,
        integration: new HttpLambdaIntegration(
          `lambda-proxy-integration-${deploymentTarget}`,
          this.lambdaProxyRouteEntryHandler,
          {
            payloadFormatVersion: PayloadFormatVersion.VERSION_2_0,
          },
        ),
        routeKey: HttpRouteKey.with(path, method as HttpMethod),
      });
    });
  }
}
