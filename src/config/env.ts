import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ============================================================
// Environment variable validation & export
// ============================================================

export function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function optionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export const env = {
    // Server
    NODE_ENV: optionalEnv('NODE_ENV', 'development'),
    PORT: parseInt(optionalEnv('PORT', '3000'), 10),
    API_VERSION: optionalEnv('API_VERSION', 'v1'),

    // Database
    DB_HOST: optionalEnv('DB_HOST', 'localhost'),
    DB_PORT: parseInt(optionalEnv('DB_PORT', '5432'), 10),
    DB_NAME: optionalEnv('DB_NAME', 'tassa_dev'),
    DB_USER: optionalEnv('DB_USER', 'postgres'),
    DB_PASSWORD: optionalEnv('DB_PASSWORD', ''),
    DB_SSL: optionalEnv('DB_SSL', 'false') === 'true',
    DB_POOL_MIN: parseInt(optionalEnv('DB_POOL_MIN', '2'), 10),
    DB_POOL_MAX: parseInt(optionalEnv('DB_POOL_MAX', '10'), 10),

    // JWT — REQUIRED in production, unsafe defaults only for dev
    JWT_ACCESS_SECRET: optionalEnv('NODE_ENV', 'development') === 'production'
        ? requireEnv('JWT_ACCESS_SECRET')
        : optionalEnv('JWT_ACCESS_SECRET', 'dev-access-secret-change-in-production'),
    JWT_REFRESH_SECRET: optionalEnv('NODE_ENV', 'development') === 'production'
        ? requireEnv('JWT_REFRESH_SECRET')
        : optionalEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
    JWT_ACCESS_EXPIRY: optionalEnv('JWT_ACCESS_EXPIRY', '15m'),
    JWT_REFRESH_EXPIRY: optionalEnv('JWT_REFRESH_EXPIRY', '30d'),

    // Firebase
    FIREBASE_PROJECT_ID: optionalEnv('FIREBASE_PROJECT_ID', ''),
    FIREBASE_SERVICE_ACCOUNT_PATH: optionalEnv('FIREBASE_SERVICE_ACCOUNT_PATH', ''),

    // Razorpay
    RAZORPAY_KEY_ID: optionalEnv('RAZORPAY_KEY_ID', ''),
    RAZORPAY_KEY_SECRET: optionalEnv('RAZORPAY_KEY_SECRET', ''),
    RAZORPAY_WEBHOOK_SECRET: optionalEnv('RAZORPAY_WEBHOOK_SECRET', ''),

    // 2Factor OTP
    TWOFACTOR_API_KEY: optionalEnv('TWOFACTOR_API_KEY', ''),
    TWOFACTOR_TEMPLATE_NAME: optionalEnv('TWOFACTOR_TEMPLATE_NAME', ''),

    // Redis
    REDIS_URL: optionalEnv('REDIS_URL', ''),

    // CORS — restrict to explicit origins in production
    CORS_ORIGINS: optionalEnv('NODE_ENV', 'development') === 'production'
        ? requireEnv('CORS_ORIGINS').split(',')
        : optionalEnv('CORS_ORIGINS', '*').split(','),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),

    // Dev OTP Bypass (for testing with fake phone numbers like seeded vendor)
    DEV_OTP_BYPASS: optionalEnv('NODE_ENV', 'development') === 'production'
        ? false
        : optionalEnv('DEV_OTP_BYPASS', 'true') === 'true',
    DEV_OTP_CODE: optionalEnv('DEV_OTP_CODE', '123456'),

    // Helpers
    isDev: optionalEnv('NODE_ENV', 'development') === 'development',
    isProd: optionalEnv('NODE_ENV', 'development') === 'production',
    isTest: optionalEnv('NODE_ENV', 'development') === 'test',
} as const;
