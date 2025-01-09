import dotenv from 'dotenv';
import {devSettings, prodSettings} from './env_configs/settings_config';

dotenv.config();

console.log("settings.js environment: " + process.env.NODE_ENV);
console.log("dev config: %j \nprod config: %j", devSettings, prodSettings)

export const testEnvironmentVariable = process.env.TEST_ENV_VARIABLE;

export const env = process.env.NODE_ENV || 'dev';

//
export const appConfig = env == 'dev' ? devSettings: prodSettings ;

//temporary test settings
// export const dbUserName = process.env.DB_USER_NAME;
// export const dbPassword = process.env.DB_PASSWORD;
// export const dbUri = process.env.DB_URI_DEVELOPMENT;
// export const dbSKey = process.env.DB_SECRET_KEY;
// export const serverUrl = process.env.SERVER_URL;
// export const corsDNS = process.env.DEV_CORS_DNS;




