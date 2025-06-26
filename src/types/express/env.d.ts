declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    PORT: string;
    DATABASE_URL: string;
    LOCALHOST_URL: string;
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRESIN: string;
    ACCESS_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRESIN: string;

    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;

    S3_BUCKET_NAME: string;
    S3_FOLDER_NAME: string;
  }
}
