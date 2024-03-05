import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { StringAttribute, UserPool, UserPoolClient, UserPoolOperation } from 'aws-cdk-lib/aws-cognito';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path = require('path');

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    const preSignupFunc = new Function(this, 'employee-pre-signup', {
      ...lambdaConfig,
      description: 'cognito pre signup trigger',
      code: Code.fromAsset(path.join(__dirname, '../../lambda/functions/pre-signup')),
      functionName: 'employee-pre-signup',
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

    userPool.addTrigger(UserPoolOperation.PRE_SIGN_UP, preSignupFunc);

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
