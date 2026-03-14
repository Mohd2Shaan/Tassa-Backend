import { Request } from 'express';
import { PaginationMeta } from './apiResponse';

// ============================================================
// Pagination Helper
// ============================================================

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

/**
 * Extract pagination params from request query string.
 * Defaults: page=1, limit=20, max limit=100
 */
export function getPaginationParams(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * Build pagination meta for response.
 */
export function buildPaginationMeta(
    page: number,
    limit: number,
    total: number,
): PaginationMeta {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}
