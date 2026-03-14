import jwt, { JwtPayload as JwtStandardPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';

// ============================================================
// JWT Utility
// ============================================================

/**
 * Custom JWT payload for Tassa.
 * Embedded in both access and refresh tokens.
 */
export interface TassaJwtPayload {
    userId: string;
    phone: string;
    roles: string[];
    activeRole: string;
}

/**
 * Decoded JWT with standard + custom fields.
 */
export interface DecodedToken extends TassaJwtPayload {
    iat: number;
    exp: number;
}

/**
 * Generate a short-lived access token (15 minutes by default).
 */
const JWT_ISSUER = 'tassa-api';
const JWT_AUDIENCE = 'tassa-app';

export function generateAccessToken(payload: TassaJwtPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY as string & jwt.SignOptions['expiresIn'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
}

/**
 * Generate a long-lived refresh token (30 days by default).
 */
export function generateRefreshToken(payload: TassaJwtPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY as string & jwt.SignOptions['expiresIn'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
}

/**
 * Verify and decode an access token.
 * Throws if the token is invalid or expired.
 */
export function verifyAccessToken(token: string): DecodedToken {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    }) as JwtStandardPayload & TassaJwtPayload;
    return {
        userId: decoded.userId,
        phone: decoded.phone,
        roles: decoded.roles,
        activeRole: decoded.activeRole,
        iat: decoded.iat!,
        exp: decoded.exp!,
    };
}

/**
 * Verify and decode a refresh token.
 * Throws if the token is invalid or expired.
 */
export function verifyRefreshToken(token: string): DecodedToken {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    }) as JwtStandardPayload & TassaJwtPayload;
    return {
        userId: decoded.userId,
        phone: decoded.phone,
        roles: decoded.roles,
        activeRole: decoded.activeRole,
        iat: decoded.iat!,
        exp: decoded.exp!,
    };
}

/**
 * Hash a token for storage (we never store raw tokens in DB).
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}
