import {
  StackProps,
  NestedStackProps,
  aws_certificatemanager as acm,
  aws_ec2 as ec2,
  aws_route53 as r53,
} from 'aws-cdk-lib';
import { AppMetadata } from '../config';

export interface ExtendedStackProps extends StackProps {
  deploymentTarget: string;
  awsRegion: string;
  appMetadata: AppMetadata;
}

export interface ExtendedNestedStackProps extends NestedStackProps, ExtendedStackProps {
  resourceSuffix: string;
  fqdn: string;
  orgNameAbbv: string;
  wildcardCert?: acm.Certificate;
  vpc?: ec2.Vpc;
  hostedZone?: r53.HostedZone;
}
