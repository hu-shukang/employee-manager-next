declare namespace NodeJS {
  export interface ProcessEnv {
    REGION: string;
    COGNITO_CLIENT_ID: string;
    COGNITO_CLIENT_SECRET: string;
    COGNITO_ISSUER: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
  }
}
