import NextAuth from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';

const { handlers } = NextAuth({
  providers: [
    CognitoProvider({
      id: 'cognito',
      clientId: process.env.COGNITO_CLIENT_ID,
      clientSecret: process.env.COGNITO_CLIENT_SECRET,
      issuer: process.env.COGNITO_ISSUER,
    }),
  ],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
