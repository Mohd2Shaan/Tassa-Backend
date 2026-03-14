import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { RoleName } from '../utils/constants';

// ============================================================
// Role-Based Authorization Middleware
// ============================================================

/**
 * Authorize middleware — checks if the authenticated user's active role
 * is one of the allowed roles.
 *
 * Must be used AFTER `authenticate` middleware.
 *
 * Usage:
 *   router.get('/admin/dashboard', authenticate, authorize('ADMIN'), controller.dashboard);
 *   router.post('/orders', authenticate, authorize('CUSTOMER'), controller.createOrder);
 *   router.get('/items', authenticate, authorize('VENDOR', 'ADMIN'), controller.listItems);
 */
export function authorize(...allowedRoles: RoleName[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(AppError.unauthorized('Authentication required'));
            return;
        }

        const { activeRole, roles } = req.user;

        // Check if the user's active role is in the allowed list
        if (!allowedRoles.includes(activeRole as RoleName)) {
            next(
                AppError.forbidden(
                    `Access denied. Required role: ${allowedRoles.join(' or ')}. Your active role: ${activeRole}`,
                ),
            );
            return;
        }

        // Also verify the user actually has this role assigned
        if (!roles.includes(activeRole)) {
            next(
                AppError.forbidden(
                    'Your active role is not in your assigned roles. Please switch to a valid role.',
                ),
            );
            return;
        }

        next();
    };
}
