import winston from 'winston';
import { env } from './env';

// ============================================================
// Structured Logger (Winston)
// ============================================================

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.isDev
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${level}]: ${message}${metaStr}`;
            }),
        )
        : winston.format.json(), // JSON format in production for log aggregation
);

export const logger = winston.createLogger({
    level: env.isDev ? 'debug' : 'info',
    format: logFormat,
    defaultMeta: { service: 'tassa-api' },
    transports: [
        new winston.transports.Console(),
    ],
    // Don't exit on uncaught errors
    exitOnError: false,
});

// In production, also log to files
if (env.isProd) {
    logger.add(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    );
    logger.add(
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
        }),
    );
}
