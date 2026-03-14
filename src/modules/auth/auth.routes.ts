import { Router } from 'express';
import { validate } from '../../middlewares/validator';
import { authenticate } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimiter';
import * as authController from './auth.controller';
import {
    refreshTokenSchema,
    switchRoleSchema,
    logoutSchema,
    sendOtpSchema,
    verifySmsOtpSchema,
} from './auth.validation';

// ============================================================
// Auth Routes
// ============================================================

const router = Router();

// ---- 2Factor SMS OTP Flow ----

/**
 * POST /auth/send-otp
 * Public — Send OTP to phone via 2Factor SMS API.
 */
router.post(
    '/send-otp',
    authLimiter,
    validate(sendOtpSchema),
    authController.sendOtp,
);

/**
 * POST /auth/verify-sms-otp
 * Public — Verify OTP from 2Factor and login/register.
 */
router.post(
    '/verify-sms-otp',
    authLimiter,
    validate(verifySmsOtpSchema),
    authController.verifySmsOtp,
);

// ---- Token Management ----

/**
 * POST /auth/refresh-token
 * Public — Refresh access token using refresh token.
 * Rate limited (strict auth limiter).
 */
router.post(
    '/refresh-token',
    authLimiter,
    validate(refreshTokenSchema),
    authController.refreshToken,
);

/**
 * POST /auth/switch-role
 * Protected — Switch active role.
 */
router.post(
    '/switch-role',
    authenticate,
    validate(switchRoleSchema),
    authController.switchRole,
);

/**
 * POST /auth/logout
 * Public (but needs refresh token) — Revoke refresh token.
 */
router.post(
    '/logout',
    validate(logoutSchema),
    authController.logout,
);

/**
 * GET /auth/me
 * Protected — Get current user profile.
 */
router.get(
    '/me',
    authenticate,
    authController.me,
);

export default router;
