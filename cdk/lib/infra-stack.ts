import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { StringAttribute, UserPool, UserPoolClient, UserPoolOperation } from 'aws-cdk-lib/aws-cognito';
import {
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointAwsService,
  InterfaceVpcEndpointService,
  IpAddresses,
  Subnet,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { AnyPrincipal, Effect, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path = require('path');

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'employee-vpc', {
      vpcName: 'employee-vpc',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      createInternetGateway: true,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    const privateApiVpcEndpoint = new InterfaceVpcEndpoint(this, 'MyVpcEndpoint', {
      vpc,
      service: InterfaceVpcEndpointAwsService.APIGATEWAY,
      subnets: { subnets: vpc.privateSubnets },
      open: false,
    });

    const lambdaAccessRole = Role.fromRoleArn(
      this,
      'lambdaAccessRole',
      'arn:aws:iam::146114061358:role/LambdaAccessRole',
      { mutable: false },
    );

    const lambdaConfig = {
      runtime: Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      role: lambdaAccessRole,
      timeout: Duration.minutes(15),
      memorySize: 128,
    };

    const cognitoProxyFunc = new Function(this, 'employee-cognito-proxy', {
      ...lambdaConfig,
      description: 'cognito proxy',
      code: Code.fromAsset(path.join(__dirname, '../../lambda/function/cognito_proxy')),
      functionName: 'employee-cognito-proxy',
    });

    const userPool = new UserPool(this, 'employee-user-pool', {
      userPoolName: 'employee-user-pool',
      removalPolicy: RemovalPolicy.DESTROY,
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      userVerification: {
        emailSubject: 'Please verify your account',
        emailBody: 'The verification code to your account is {####}',
      },
      standardAttributes: {
        email: { required: true, mutable: false },
        fullname: { required: true, mutable: true },
      },
      customAttributes: {
        role: new StringAttribute({ mutable: true }),
      },
    });

    userPool.addDomain('employee-user-pool-domain', {
      cognitoDomain: { domainPrefix: 'employee' },
    });

    const privateApi = new LambdaRestApi(this, 'privateApi', {
      endpointTypes: [EndpointType.PRIVATE],
      handler: cognitoProxyFunc,
      policy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            principals: [new AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
            effect: Effect.DENY,
            conditions: {
              StringNotEquals: {
                'aws:SourceVpce': privateApiVpcEndpoint.vpcEndpointId,
              },
            },
          }),
          new PolicyStatement({
            principals: [new AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
            effect: Effect.ALLOW,
          }),
        ],
      }),
    });

    // userPool.addTrigger(UserPoolOperation.PRE_SIGN_UP, preSignupFunc);

    const userPoolClient = new UserPoolClient(this, 'employee-user-pool-client', {
      userPoolClientName: 'employee-user-pool-client',
      userPool: userPool,
      generateSecret: true,
      authFlows: { userPassword: true },
      oAuth: {
        callbackUrls: ['http://localhost:3000/api/auth/callback/cognito'],
        logoutUrls: ['http://localhost:3000/api/auth/signout'],
      },
    });
  }
}
