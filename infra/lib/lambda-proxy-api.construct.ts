import {
  aws_lambda_nodejs as lambda,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_sqs as sqs,
  Duration,
  aws_s3 as s3,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { HttpApi, HttpRoute, HttpRouteKey, HttpMethod, PayloadFormatVersion } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import { RouteConfig } from 'aws-lambda-api-tools';
import { ExtendedStackProps } from './stack-interfaces';
import { Architecture, LoggingFormat, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { CustomHttpLambdaIntegration } from './CustomHttpLambdaIntegration';

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
  documentsBucket: Bucket;
  pdfGeneratorQueue: sqs.IQueue;
  caseCriterionCalcQueue: sqs.IQueue;
  sqsBroadcastMessageQueue: sqs.IQueue;
  sqsActivityLogQueue: sqs.IQueue;
  sendEmailQueue: sqs.IQueue;
}

export class LambdaProxyApi extends Construct {
  public readonly lambdaProxyRouteEntryHandler: lambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaProxyApiProps) {
    super(scope, id);

    // @ts-ignore
    const { awsRegion, deploymentTarget, documentsBucket, caseCriterionCalcQueue } = props;

    const httpApi = HttpApi.fromHttpApiAttributes(this, 'http-api', {
      httpApiId: props.ssmHttpApiId,
    });

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });

    const lambdaRouteProxyEntryHandlerName = props.name;
    this.lambdaProxyRouteEntryHandler = new lambda.NodejsFunction(
      this,
      `${lambdaRouteProxyEntryHandlerName}-${deploymentTarget}`,
      {
        architecture: Architecture.X86_64,
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
          SQS_BROADCAST_MSG_QUEUE_URL: props.sqsBroadcastMessageQueue.queueUrl,
          SQS_BROADCAST_MSG_QUEUE_NAME: props.sqsBroadcastMessageQueue.queueName,
          SQS_ACTIVITY_LOG_QUEUE_URL: props.sqsActivityLogQueue.queueUrl,
        },
        loggingFormat: LoggingFormat.JSON,
        logRetention: RetentionDays.ONE_WEEK,
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
      },
    );

    documentsBucket.grantReadWrite(this.lambdaProxyRouteEntryHandler);

    props.sqsBroadcastMessageQueue.grantSendMessages(this.lambdaProxyRouteEntryHandler);
    props.sqsActivityLogQueue.grantSendMessages(this.lambdaProxyRouteEntryHandler);
    props.sendEmailQueue.grantSendMessages(this.lambdaProxyRouteEntryHandler);

    // Lambda Proxy Can trigger pdf generation
    props.pdfGeneratorQueue.grantSendMessages(this.lambdaProxyRouteEntryHandler);

    // Lambda proxy can dispatch case criterion calculation events
    caseCriterionCalcQueue.grantSendMessages(this.lambdaProxyRouteEntryHandler);

    // new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   resources: ['*'],
    //   actions: ['lambda:InvokeFunction'],
    // })

    if (props.iamPolicy) {
      this.lambdaProxyRouteEntryHandler.addToRolePolicy(props.iamPolicy);
    }

    /* Configure Routes */

    console.log(`ROUTE CONFIG:
    ${JSON.stringify(props.routeConfig.routes)}
    `);

    const httpLambdaIntegration = new CustomHttpLambdaIntegration(
      `lambda-proxy-integration-${deploymentTarget}`,
      this.lambdaProxyRouteEntryHandler,
      {
        payloadFormatVersion: PayloadFormatVersion.VERSION_2_0,
      },
    );

    props.routeConfig.routes.forEach(({ method, path }) => {
      new HttpRoute(this, `http-route-${method}-${path}`, {
        httpApi,
        integration: httpLambdaIntegration,
        routeKey: HttpRouteKey.with(path, method as HttpMethod),
      });
    });
  }
}
