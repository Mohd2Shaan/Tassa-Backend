import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// ============================================================
// Rate Limiter Middleware
// ============================================================

/**
 * General API rate limiter.
 * Default: 100 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for auth endpoints (OTP).
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for payment endpoints.
 * 20 requests per 15 minutes per IP.
 */
export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many payment requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for webhook endpoints.
 * 30 requests per minute per IP — Razorpay webhooks are infrequent,
 * so this is generous while preventing flood abuse.
 */
export const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Too many webhook requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
