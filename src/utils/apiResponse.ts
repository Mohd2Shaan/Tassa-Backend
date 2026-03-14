import { Response } from 'express';

// ============================================================
// Standardized API Response
// ============================================================
// All API responses follow this format:
// { success: boolean, message: string, data?: T, error?: any, pagination?: PaginationMeta }

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponseBody<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: unknown;
    pagination?: PaginationMeta;
}

export class ApiResponse {
    /**
     * Send a successful response.
     */
    static success<T>(
        res: Response,
        data: T,
        message = 'Success',
        statusCode = 200,
        pagination?: PaginationMeta,
    ): Response {
        const body: ApiResponseBody<T> = {
            success: true,
            message,
            data,
        };
        if (pagination) {
            body.pagination = pagination;
        }
        return res.status(statusCode).json(body);
    }

    /**
     * Send a 201 Created response.
     */
    static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
        return ApiResponse.success(res, data, message, 201);
    }

    /**
     * Send a success response with no data.
     */
    static noContent(res: Response, _message = 'Success'): Response {
        return res.status(204).send();
    }

    /**
     * Send an error response.
     */
    static error(
        res: Response,
        message = 'Something went wrong',
        statusCode = 500,
        error?: unknown,
    ): Response {
        const body: ApiResponseBody = {
            success: false,
            message,
        };
        if (error && process.env.NODE_ENV === 'development') {
            body.error = error;
        }
        return res.status(statusCode).json(body);
    }

    /**
     * 400 — Bad Request
     */
    static badRequest(res: Response, message = 'Bad request', error?: unknown): Response {
        return ApiResponse.error(res, message, 400, error);
    }

    /**
     * 401 — Unauthorized
     */
    static unauthorized(res: Response, message = 'Unauthorized'): Response {
        return ApiResponse.error(res, message, 401);
    }

    /**
     * 403 — Forbidden
     */
    static forbidden(res: Response, message = 'Forbidden'): Response {
        return ApiResponse.error(res, message, 403);
    }

    /**
     * 404 — Not Found
     */
    static notFound(res: Response, message = 'Resource not found'): Response {
        return ApiResponse.error(res, message, 404);
    }

    /**
     * 409 — Conflict
     */
    static conflict(res: Response, message = 'Conflict'): Response {
        return ApiResponse.error(res, message, 409);
    }

    /**
     * 422 — Unprocessable Entity (validation error)
     */
    static validationError(res: Response, message = 'Validation error', error?: unknown): Response {
        return ApiResponse.error(res, message, 422, error);
    }

    /**
     * 429 — Too Many Requests
     */
    static tooManyRequests(res: Response, message = 'Too many requests'): Response {
        return ApiResponse.error(res, message, 429);
    }
}
