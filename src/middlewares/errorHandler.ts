import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';
import { env } from '../config/env';

// ============================================================
// Global Error Handler Middleware
// ============================================================
// Must be the LAST middleware in the chain.
// Catches all errors and sends a standardized response.

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    // Default values
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }

    // Log the error
    if (!isOperational) {
        // Programming errors — log full stack
        logger.error('Unhandled error', {
            message: err.message,
            stack: err.stack,
            statusCode,
        });
    } else {
        // Operational errors — log as warning
        logger.warn('Operational error', {
            message: err.message,
            statusCode,
        });
    }

    // Send response
    const response: Record<string, unknown> = {
        success: false,
        message,
    };

    // Include stack trace only in development
    if (env.isDev && err.stack) {
        response.stack = err.stack;
    }

    // Include error code if it's an AppError
    if (err instanceof AppError && err.code) {
        response.code = err.code;
    }

    res.status(statusCode).json(response);
}

/**
 * Handle 404 — route not found.
 * Place BEFORE errorHandler but AFTER all routes.
 */
export function notFoundHandler(
    req: Request,
    _res: Response,
    next: NextFunction,
): void {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
