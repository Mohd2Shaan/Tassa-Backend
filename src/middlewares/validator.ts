import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

// ============================================================
// Request Validation Middleware (Zod)
// ============================================================
// Validates request body, params, or query against a Zod schema.
//
// Usage:
//   router.post('/items', validate(createItemSchema), controller.create);
//
// Where createItemSchema is:
//   const createItemSchema = z.object({
//     body: z.object({ name: z.string().min(1), price: z.number().positive() }),
//   });

interface ValidationSchemas {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}

/**
 * Validate request body, params, and/or query.
 * Accepts a Zod schema or an object with body/params/query schemas.
 */
export function validate(schema: ZodSchema | ValidationSchemas) {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            if ('body' in schema || 'params' in schema || 'query' in schema) {
                const schemas = schema as ValidationSchemas;
                if (schemas.body) {
                    req.body = schemas.body.parse(req.body);
                }
                if (schemas.params) {
                    req.params = schemas.params.parse(req.params) as Record<string, string>;
                }
                if (schemas.query) {
                    req.query = schemas.query.parse(req.query) as Record<string, string>;
                }
            } else {
                // Single schema — validate the entire request
                (schema as ZodSchema).parse({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                });
            }
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const errors = err.issues.map((issue) => ({
                    field: issue.path.map(String).join('.'),
                    message: issue.message,
                }));
                next(new AppError(`Validation error: ${errors.map(e => e.message).join(', ')}`, 422, true, 'VALIDATION_ERROR'));
            } else {
                next(err);
            }
        }
    };
}
