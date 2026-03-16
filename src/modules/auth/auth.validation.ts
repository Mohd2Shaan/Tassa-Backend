import { z } from 'zod';

// ============================================================
// Auth Validation Schemas (Zod)
// ============================================================

/**
 * POST /auth/refresh-token
 * Client sends the refresh token to get a new access token.
 */
export const refreshTokenSchema = {
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
};

/**
 * POST /auth/switch-role
 * Client switches the active role (e.g., CUSTOMER ↔ VENDOR).
 */
export const switchRoleSchema = {
    body: z.object({
        role: z.enum(['CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER', 'ADMIN'], {
            message: 'Invalid role. Must be CUSTOMER, VENDOR, DELIVERY_PARTNER, or ADMIN.',
        }),
    }),
};

/**
 * POST /auth/logout
 * Client sends the refresh token to revoke.
 */
export const logoutSchema = {
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
};

// ============================================================
// 2Factor OTP Schemas
// ============================================================

/**
 * POST /auth/send-otp
 * Send OTP to phone via 2Factor SMS API.
 */
export const sendOtpSchema = {
    body: z.object({
        phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
        isSignup: z.boolean().optional(),
        role: z.enum(['CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER']).optional(),
    }),
};

/**
 * POST /auth/verify-sms-otp
 * Verify OTP received via 2Factor SMS API.
 */
export const verifySmsOtpSchema = {
    body: z.object({
        phone: z.string().min(10, 'Phone number is required').max(15),
        sessionId: z.string().min(1, 'Session ID is required'),
        otp: z.string().length(6, 'OTP must be 6 digits'),
        fullName: z.string().min(1, 'Full name is required').max(100).optional(),
        deviceInfo: z.string().optional(),
        role: z.enum(['CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER']).optional(),
    }),
};
