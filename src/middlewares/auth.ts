import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, DecodedToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

// ============================================================
// Authentication Middleware
// ============================================================

/**
 * Augment Express Request to include authenticated user.
 */
declare global {
    namespace Express {
        interface Request {
            user?: DecodedToken;
        }
    }
}

/**
 * Authenticate middleware — verifies JWT access token from Authorization header.
 *
 * Extracts Bearer token, verifies it, and attaches decoded payload to req.user.
 * If the token is missing or invalid, responds with 401.
 *
 * Usage:
 *   router.get('/profile', authenticate, controller.getProfile);
 */
export function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw AppError.unauthorized('Access token is required');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw AppError.unauthorized('Access token is required');
        }

        // Verify and decode the token
        const decoded = verifyAccessToken(token);
        req.user = decoded;

        next();
    } catch (err) {
        if (err instanceof AppError) {
            next(err);
        } else {
            // JWT verification errors (expired, malformed, etc.)
            next(AppError.unauthorized('Invalid or expired access token'));
        }
    }
}

/**
 * Optional authentication — attaches user if token present, but doesn't fail.
 * Useful for endpoints that work for both authenticated and anonymous users.
 */
export function optionalAuthenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
): void {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                req.user = verifyAccessToken(token);
            }
        }
    } catch {
        // Token is invalid — that's fine for optional auth, just don't attach user
    }

    next();
}
