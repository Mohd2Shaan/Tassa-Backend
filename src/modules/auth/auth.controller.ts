import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as authService from './auth.service';

// ============================================================
// Auth Controller — Route Handlers
// ============================================================

/**
 * POST /api/v1/auth/refresh-token
 * Refresh access token using a valid refresh token.
 * Implements token rotation.
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: rawRefreshToken } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const tokens = await authService.refreshAccessToken(
        rawRefreshToken,
        undefined, // deviceInfo could be extracted from User-Agent
        ipAddress,
    );

    ApiResponse.success(res, tokens, 'Token refreshed successfully');
});

/**
 * POST /api/v1/auth/switch-role
 * Switch the active role for the authenticated user.
 * Requires authentication.
 */
export const switchRole = asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.body;
    const userId = req.user!.userId;

    const result = await authService.switchRole(userId, role);

    ApiResponse.success(res, result, `Switched to ${role} role`);
});

/**
 * POST /api/v1/auth/logout
 * Revoke the refresh token.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: rawRefreshToken } = req.body;

    await authService.logout(rawRefreshToken);

    ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * GET /api/v1/auth/me
 * Get the current authenticated user's profile.
 * Requires authentication.
 */
export const me = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await authService.getCurrentUser(userId);

    ApiResponse.success(res, user, 'User profile retrieved');
});

// ============================================================
// 2Factor SMS OTP Endpoints
// ============================================================

/**
 * POST /api/v1/auth/send-otp
 * Send OTP to phone via 2Factor SMS API.
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, isSignup, role } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.sendSmsOtp(phone, ipAddress, isSignup, role);

    ApiResponse.success(res, result, 'OTP sent successfully');
});

/**
 * POST /api/v1/auth/verify-sms-otp
 * Verify OTP and login/register user.
 */
export const verifySmsOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, sessionId, otp, deviceInfo, fullName, role } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.verifySmsOtpAndLogin(
        phone, sessionId, otp, deviceInfo, ipAddress, fullName, role,
    );

    const statusCode = result.user.isNewUser ? 201 : 200;
    const message = result.user.isNewUser
        ? 'Registration successful'
        : 'Login successful';

    ApiResponse.success(res, result, message, statusCode);
});
