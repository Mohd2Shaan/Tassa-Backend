// ============================================================
// Custom Application Error
// ============================================================
// Extends Error with HTTP status code and operational flag.
// Operational errors are expected (e.g., validation failures).
// Programming errors are unexpected and should be logged.

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(
        message: string,
        statusCode = 500,
        isOperational = true,
        code?: string,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;

        // Maintains proper stack trace
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, AppError.prototype);
    }

    // ---- Factory methods for common errors ----

    static badRequest(message = 'Bad request', code?: string): AppError {
        return new AppError(message, 400, true, code);
    }

    static unauthorized(message = 'Unauthorized', code?: string): AppError {
        return new AppError(message, 401, true, code);
    }

    static forbidden(message = 'Forbidden', code?: string): AppError {
        return new AppError(message, 403, true, code);
    }

    static notFound(message = 'Resource not found', code?: string): AppError {
        return new AppError(message, 404, true, code);
    }

    static conflict(message = 'Conflict', code?: string): AppError {
        return new AppError(message, 409, true, code);
    }

    static validationError(message = 'Validation error', code?: string): AppError {
        return new AppError(message, 422, true, code);
    }

    static tooManyRequests(message = 'Too many requests', code?: string): AppError {
        return new AppError(message, 429, true, code);
    }

    static internal(message = 'Internal server error'): AppError {
        return new AppError(message, 500, false);
    }
}
