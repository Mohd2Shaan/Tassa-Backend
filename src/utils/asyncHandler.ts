import { Request, Response, NextFunction } from 'express';

// ============================================================
// Async Handler Wrapper
// ============================================================
// Wraps async route handlers to catch errors and forward to
// the global error handler. Avoids try/catch in every controller.
//
// Usage:
//   router.get('/items', asyncHandler(async (req, res) => {
//     const items = await itemService.getAll();
//     ApiResponse.success(res, items);
//   }));

type AsyncRouteHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<unknown>;

export function asyncHandler(fn: AsyncRouteHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
