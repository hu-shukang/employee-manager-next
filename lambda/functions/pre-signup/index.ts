import { PreSignUpTriggerEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: PreSignUpTriggerEvent) => {
  console.log('Pre sign-up event:', event);
  return event;
};
