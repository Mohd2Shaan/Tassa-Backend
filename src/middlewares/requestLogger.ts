import morgan from 'morgan';
import { logger } from '../config/logger';

// ============================================================
// Request Logger Middleware (Morgan + Winston)
// ============================================================
// Pipes HTTP request logs through Winston for consistency.

const stream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};

/**
 * Development: colored, concise logs.
 * Production: standard Apache combined format.
 */
export const requestLogger = morgan(
    process.env.NODE_ENV === 'production'
        ? 'combined'
        : ':method :url :status :response-time ms - :res[content-length]',
    { stream },
);
