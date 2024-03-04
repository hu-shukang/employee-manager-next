import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { StringAttribute, UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
