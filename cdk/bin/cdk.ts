#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';

const synthesizer = new cdk.CliCredentialsStackSynthesizer({
  fileAssetsBucketName: 'hsk-cdk-working',
  bucketPrefix: `next-demo01`,
  qualifier: `next-demo01`,
});
const region = 'ap-northeast-1';

const app = new cdk.App({ defaultStackSynthesizer: synthesizer });

new InfraStack(app, 'infra', {
  env: { region: region },
});
