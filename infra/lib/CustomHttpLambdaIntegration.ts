import { Stack } from 'aws-cdk-lib';
import { IFunction, Function } from 'aws-cdk-lib/aws-lambda';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { HttpRouteIntegrationBindOptions } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration, HttpLambdaIntegrationProps } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class CustomHttpLambdaIntegration extends HttpLambdaIntegration {
  permissionAdded = false;

  constructor(id: string, handler: IFunction, props?: HttpLambdaIntegrationProps) {
    super(id, handler, props);
  }

  protected completeBind(options: HttpRouteIntegrationBindOptions) {
    if (!this.permissionAdded) {
      this.permissionAdded = true;
      const route = options.route;
      const nonReadonlyHandler = (this as any).handler as Function;
      const nonPrivateId = (this as any)._id as string;
      nonReadonlyHandler.addPermission(`${nonPrivateId}-Permission`, {
        scope: options.scope,
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: Stack.of(route).formatArn({
          service: 'execute-api',
          resource: route.httpApi.apiId,
          resourceName: `*/*`, // always use */*
        }),
      });
    }
  }
}
