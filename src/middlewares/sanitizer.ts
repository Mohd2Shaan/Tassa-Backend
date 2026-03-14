import { Request, Response, NextFunction } from 'express';

// ============================================================
// M3: Input Sanitization Middleware
// ============================================================

/**
 * Sanitizes string values in req.body to prevent XSS.
 * Strips HTML tags and trims whitespace from all string fields.
 * Applied before route handlers to ensure clean input.
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
        req.body = deepSanitize(req.body);
    }
    next();
}

/**
 * Recursively sanitize all string values in an object.
 * - Strips HTML tags (basic XSS prevention)
 * - Trims leading/trailing whitespace
 * - Preserves null, numbers, booleans, and arrays
 */
function deepSanitize(obj: unknown): unknown {
    if (typeof obj === 'string') {
        return stripHtmlTags(obj).trim();
    }

    if (Array.isArray(obj)) {
        return obj.map(deepSanitize);
    }

    if (obj !== null && typeof obj === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = deepSanitize(value);
        }
        return sanitized;
    }

    return obj; // numbers, booleans, null, undefined — pass through
}

/**
 * Strip HTML tags from a string.
 * This is a basic implementation — for production with rich text,
 * consider using DOMPurify or sanitize-html.
 */
function stripHtmlTags(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> blocks
        .replace(/<[^>]*>/g, '');  // Remove remaining HTML tags
        // NOTE: Entity decoding removed — decoding &lt; → < after stripping
        // would re-introduce XSS vectors from encoded payloads.
}
