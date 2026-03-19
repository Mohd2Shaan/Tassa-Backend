import { AppError } from '../../utils/AppError';
import { ROLES } from '../../utils/constants';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    hashToken,
    TassaJwtPayload,
} from '../../utils/jwt';
import * as authRepo from './auth.repository';
import { logger } from '../../config/logger';

// ============================================================
// Auth Service — Business Logic
// ============================================================

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResult {
    user: {
        id: string;
        phone: string;
        fullName: string | null;
        email: string | null;
        avatarUrl: string | null;
        roles: string[];
        activeRole: string;
        isNewUser: boolean;
    };
    tokens: AuthTokens;
}

/**
 * Refresh the access token using a valid refresh token.
 * Implements token rotation — old refresh token is revoked, new one is issued.
 */
export async function refreshAccessToken(
    rawRefreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
): Promise<AuthTokens> {
    // 1. Verify the refresh token JWT
    let decoded;
    try {
        decoded = verifyRefreshToken(rawRefreshToken);
    } catch {
        throw AppError.unauthorized('Invalid or expired refresh token');
    }

    // 2. Check if token exists and is not revoked
    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await authRepo.findRefreshToken(tokenHash);

    if (!storedToken) {
        // Token not found or revoked — potential token reuse attack
        // Revoke ALL tokens for this user as a safety measure
        logger.warn('Refresh token reuse detected', { userId: decoded.userId });
        await authRepo.revokeAllUserTokens(decoded.userId);
        throw AppError.unauthorized('Refresh token has been revoked. Please log in again.');
    }

    // 3. Revoke the old refresh token (rotation)
    await authRepo.revokeRefreshToken(tokenHash);

    // 4. Get fresh user data and roles
    const user = await authRepo.findUserById(decoded.userId);
    if (!user) {
        throw AppError.unauthorized('User not found');
    }

    if (user.status !== 'active') {
        throw AppError.forbidden(`Your account is ${user.status}. Please contact support.`);
    }

    const userRoles = await authRepo.getUserRoles(user.id);
    const roleNames = userRoles.map((r) => r.role_name);

    // 5. Generate new token pair
    const jwtPayload: TassaJwtPayload = {
        userId: user.id,
        phone: user.phone,
        roles: roleNames,
        activeRole: decoded.activeRole, // Preserve the active role from the old token
    };

    const newAccessToken = generateAccessToken(jwtPayload);
    const newRefreshToken = generateRefreshToken(jwtPayload);

    // 6. Store new refresh token
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await authRepo.saveRefreshToken({
        userId: user.id,
        tokenHash: newTokenHash,
        deviceInfo,
        ipAddress,
        expiresAt,
    });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
}

/**
 * Switch the active role for the current user.
 * Returns a new access token with the updated role.
 */
export async function switchRole(
    userId: string,
    newRole: string,
): Promise<{ accessToken: string }> {
    // Verify the user has this role
    const hasRole = await authRepo.userHasRole(userId, newRole);
    if (!hasRole) {
        throw AppError.forbidden(`You do not have the ${newRole} role. Please register for this role first.`);
    }

    // Get user data
    const user = await authRepo.findUserById(userId);
    if (!user) {
        throw AppError.notFound('User not found');
    }

    const userRoles = await authRepo.getUserRoles(userId);
    const roleNames = userRoles.map((r) => r.role_name);

    // Generate new access token with updated active role
    const jwtPayload: TassaJwtPayload = {
        userId: user.id,
        phone: user.phone,
        roles: roleNames,
        activeRole: newRole,
    };

    const accessToken = generateAccessToken(jwtPayload);

    return { accessToken };
}

/**
 * Logout — revoke the refresh token.
 */
export async function logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await authRepo.revokeRefreshToken(tokenHash);
}

/**
 * Get current user profile with roles.
 */
export async function getCurrentUser(userId: string) {
    const user = await authRepo.findUserById(userId);
    if (!user) {
        throw AppError.notFound('User not found');
    }

    const userRoles = await authRepo.getUserRoles(userId);
    const roleNames = userRoles.map((r) => r.role_name);

    return {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        email: user.email,
        avatarUrl: user.avatar_url,
        status: user.status,
        isPhoneVerified: user.is_phone_verified,
        roles: roleNames,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
    };
}

// ============================================================
// 2Factor SMS OTP Flow
// ============================================================

import * as smsService from '../../utils/sms.service';

/**
 * Send OTP to phone via 2Factor SMS API.
 * Logs the OTP send in otp_logs table.
 * If isSignup is true, rejects the request when the phone already has an account.
 * If requestedRole is set (login flow), validates the user exists with that role.
 */
export async function sendSmsOtp(
    phone: string,
    ipAddress?: string,
    isSignup?: boolean,
    requestedRole?: string,
): Promise<{ sessionId: string }> {
    // Normalize phone: ensure +91 prefix
    const e164Phone = phone.startsWith('+') ? phone : `+91${phone}`;

    // If this is a signup request, check if the phone already has an account
    if (isSignup) {
        const existingUser = await authRepo.findUserByPhone(e164Phone);
        if (existingUser) {
            throw AppError.conflict(
                'An account with this phone number already exists. Please log in instead.',
            );
        }
    } else {
        // Login flow — validate user exists with the requested phone number
        const existingUser = await authRepo.findUserByPhone(e164Phone);
        if (!existingUser) {
            throw AppError.notFound(
                'This phone number is not registered. Please sign up first.',
            );
        }
        // If a specific non-customer role was requested, check role assignment
        if (requestedRole && requestedRole !== ROLES.CUSTOMER) {
            const hasRole = await authRepo.userHasRole(existingUser.id, requestedRole);
            if (!hasRole) {
                const roleLabel = requestedRole === ROLES.VENDOR ? 'Seller' : 'Delivery Partner';
                throw AppError.forbidden(
                    `This phone number is not registered as a ${roleLabel}. Please sign up first or choose a different role.`,
                );
            }
        }
    }

    // Log the OTP send attempt
    await authRepo.logOtpSend(e164Phone, ipAddress);

    // Send OTP via 2Factor
    const sessionId = await smsService.sendOtp(e164Phone);

    return { sessionId };
}

/**
 * Verify OTP received via 2Factor and login/register the user.
 *
 * Flow:
 * 1. Verify OTP via 2Factor API
 * 2. Find or create user by phone
 * 3. Assign requested role if new (default CUSTOMER)
 * 4. Generate JWT token pair with correct activeRole
 * 5. Store refresh token hash
 */
export async function verifySmsOtpAndLogin(
    phone: string,
    sessionId: string,
    otp: string,
    deviceInfo?: string,
    ipAddress?: string,
    fullName?: string,
    requestedRole?: string,
): Promise<AuthResult> {
    // 1. Verify OTP via 2Factor
    const isValid = await smsService.verifyOtp(sessionId, otp);
    if (!isValid) {
        throw AppError.unauthorized('Invalid OTP. Please try again.');
    }

    // Normalize phone
    const e164Phone = phone.startsWith('+') ? phone : `+91${phone}`;

    // Log the successful OTP verification
    await authRepo.logOtpVerify(e164Phone);

    // Determine the role to use (default to CUSTOMER)
    const roleToUse = requestedRole || ROLES.CUSTOMER;

    // 2. Find or create user
    let user = await authRepo.findUserByPhone(e164Phone);
    let isNewUser = false;

    if (!user) {
        user = await authRepo.createUserByPhone(e164Phone, fullName);
        isNewUser = true;

        // Assign the requested role (default CUSTOMER)
        await authRepo.assignRole(user.id, roleToUse);
        // Also assign CUSTOMER if they signed up as vendor/delivery
        // so they can also browse as customer
        if (roleToUse !== ROLES.CUSTOMER) {
            await authRepo.assignRole(user.id, ROLES.CUSTOMER);
        }

        logger.info('New user registered via SMS OTP', {
            userId: user.id,
            phone: e164Phone.slice(0, -4).replace(/./g, '*') + e164Phone.slice(-4),
            role: roleToUse,
        });
    }

    // Check if user is active
    if (user.status !== 'active' && user.status !== 'pending_verification') {
        throw AppError.forbidden(`Your account is ${user.status}. Please contact support.`);
    }

    // 3. Get user roles
    const userRoles = await authRepo.getUserRoles(user.id);
    const roleNames = userRoles.map((r) => r.role_name);

    if (roleNames.length === 0) {
        await authRepo.assignRole(user.id, ROLES.CUSTOMER);
        roleNames.push(ROLES.CUSTOMER);
    }

    // Validate existing user has the requested role
    if (!isNewUser && !roleNames.includes(roleToUse)) {
        const roleLabel = roleToUse === ROLES.VENDOR ? 'Seller'
            : roleToUse === ROLES.DELIVERY_PARTNER ? 'Delivery Partner'
            : 'Customer';
        throw AppError.forbidden(
            `This phone number is not registered as a ${roleLabel}. Please sign up for this role first.`,
        );
    }

    // Set activeRole to what the user requested (not always CUSTOMER)
    const activeRole = roleNames.includes(roleToUse) ? roleToUse : roleNames[0];

    // 4. Generate token pair
    const jwtPayload: TassaJwtPayload = {
        userId: user.id,
        phone: user.phone,
        roles: roleNames,
        activeRole,
    };

    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    // 5. Store refresh token hash
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await authRepo.saveRefreshToken({
        userId: user.id,
        tokenHash,
        deviceInfo,
        ipAddress,
        expiresAt,
    });

    // Update last login
    await authRepo.updateLastLogin(user.id);

    return {
        user: {
            id: user.id,
            phone: user.phone,
            fullName: user.full_name,
            email: user.email,
            avatarUrl: user.avatar_url,
            roles: roleNames,
            activeRole,
            isNewUser,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
    };
}
