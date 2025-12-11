import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: string;
  DB_URL: string;
  NODE_ENV: "development" | "production";
  BCRYPT_SALT_ROUND: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES: string;
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CALLBACK_URL: string;
  EXPRESS_SESSION_SECRET: string;
  FRONTEND_URL: string;

  //  Cloudinary
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;

  STRIPE_SECRET_KEY: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "DB_URL",
    "NODE_ENV",
    "BCRYPT_SALT_ROUND",
    "JWT_ACCESS_EXPIRES",
    "JWT_ACCESS_SECRET",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRES",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CALLBACK_URL",
    "EXPRESS_SESSION_SECRET",
    "FRONTEND_URL",
    //  Cloudinary
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",

    "STRIPE_SECRET_KEY",
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing require environment variabl ${key}`);
    }
  });

  return {
    PORT: process.env.PORT as string,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    DB_URL: process.env.DB_URL!,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    //  Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
  };
};

export const envVars = loadEnvVariables();
