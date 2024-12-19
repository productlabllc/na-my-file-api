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
import { Architecture, Code, LayerVersion, LoggingFormat, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { join } from 'path';

interface LambdaPdfGeneratorProps extends ExtendedStackProps {
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
export class LambdaPdfGeneratorConstruct extends Construct {
  public readonly pdfGeneratorHandler: lambdaNodeJS.NodejsFunction;

  private get graphicMagicLayer() {
    return {
      layer: new LayerVersion(this, 'GraphicsMagickLayer', {
        code: Code.fromAsset(join('src/lambdas', 'gm-layer', 'layer.zip')),
        compatibleRuntimes: [Runtime.NODEJS_18_X],
      }),
    };
  }

  constructor(scope: Construct, id: string, props: LambdaPdfGeneratorProps) {
    super(scope, id);

    const { deploymentTarget, documentsBucket, pdfGeneratorQueue } = props;

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      vpcId: props.ssmVpcId,
    });

    this.pdfGeneratorHandler = new lambdaNodeJS.NodejsFunction(this, props.name, {
      functionName: `${props.name}-${deploymentTarget}`,
      entry: props.lambdaMainHandlerPath,
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_18_X,
      vpc,
      layers: [this.graphicMagicLayer.layer],
      memorySize: props.lambdaMemorySizeInMb,
      timeout: Duration.seconds(props.lambdaTimeoutInSeconds),
      loggingFormat: LoggingFormat.JSON,
      logRetention: RetentionDays.ONE_DAY,
      events: [new SqsEventSource(pdfGeneratorQueue)],
      // vpc,
      bundling: {
        nodeModules: ['prisma', '@prisma/client', 'gm', 'pdf-lib', 'image-size'],
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [`cp ${inputDir}/prisma/schema.prisma ${outputDir}/schema.prisma`];
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [
              `cd ${outputDir}`,
              'npm install prisma@latest',
              'npm install @prisma/client@latest',
              'npx prisma generate --schema=./schema.prisma',
              // Clean up unnecessary Prisma files
              'rm -rf node_modules/@prisma/engines-version',
              'rm -rf node_modules/@prisma/engines/introspection-engine*',
              'rm -rf node_modules/@prisma/engines/migration-engine*',
              'rm -rf node_modules/@prisma/engines/prisma-fmt*',
              // Keep only the RHEL engine
              'find . -type f -name "libquery_engine-*" ! -name "libquery_engine-rhel-*" -delete',
              // Clean up the schema after generation
              'rm ./schema.prisma',
            ];
          },
        },
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: true,
        target: 'node18',
      },
      environment: {
        ...props.envVars,
        TIMESTAMP: Date.now().toString(),
        PRISMA_CLI_QUERY_ENGINE_TYPE: 'binary',
        PRISMA_BINARY_TARGET: 'rhel-openssl-1.0.x',
      },
    });

    documentsBucket.grantReadWrite(this.pdfGeneratorHandler);

    pdfGeneratorQueue.grantConsumeMessages(this.pdfGeneratorHandler);

    this.pdfGeneratorHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ['sqs:DeleteMessageBatch'],
        resources: [pdfGeneratorQueue.queueArn],
      }),
    );
  }
}
