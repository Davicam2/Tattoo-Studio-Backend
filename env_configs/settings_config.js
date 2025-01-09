import dotenv from 'dotenv';

dotenv.config();

export const testEnvironmentVariable = process.env.TEST_ENV_VARIABLE;

export const devSettings = {
    dbUserName: process.env.DEV_DB_USER_NAME,
    dbPassword: process.env.DEV_DB_PASSWORD,
    dbUri: process.env.DEV_DB_URI,
    dbSKey: process.env.DEV_DB_SECRET_KEY,
    corsDNS: process.env.DEV_CORS_DNS,
    serverURL: process.env.SERVER_URL,
    stripeSK: process.env.DEV_STRIPE_SEC_KEY
}


export const prodSettings = {
    dbUserName: process.env.PROD_DB_USER_NAME,
    dbPassword: process.env.PROD_DB_PASSWORD,
    dbUri: process.env.PROD_DB_URI,
    dbSKey: process.env.PROD_DB_SECRET_KEY,
    corsDNS: process.env.PROD_CORS_DNS,
    serverURL: process.env.SERVER_URL,
    stripeSK: process.env.PROD_STRIPE_SEC_KEY
} 