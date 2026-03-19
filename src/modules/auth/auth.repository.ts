import { query } from '../../config/database';

// ============================================================
// Auth Repository — Database Queries
// ============================================================

// ---- User Queries ----

export interface UserRow {
    id: string;
    firebase_uid: string;
    phone: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    status: string;
    is_phone_verified: boolean;
    last_login_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface UserRoleRow {
    role_id: number;
    role_name: string;
    is_active: boolean;
}

export interface RefreshTokenRow {
    id: number;
    user_id: string;
    token_hash: string;
    device_info: string | null;
    ip_address: string | null;
    expires_at: Date;
    is_revoked: boolean;
    created_at: Date;
}

/**
 * Find a user by their Firebase UID.
 */
export async function findUserByFirebaseUid(firebaseUid: string): Promise<UserRow | null> {
    const result = await query<UserRow>(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [firebaseUid],
    );
    return result.rows[0] || null;
}

/**
 * Find a user by phone number.
 */
export async function findUserByPhone(phone: string): Promise<UserRow | null> {
    const result = await query<UserRow>(
        'SELECT * FROM users WHERE phone = $1',
        [phone],
    );
    return result.rows[0] || null;
}

/**
 * Find a user by ID.
 */
export async function findUserById(userId: string): Promise<UserRow | null> {
    const result = await query<UserRow>(
        'SELECT * FROM users WHERE id = $1',
        [userId],
    );
    return result.rows[0] || null;
}

/**
 * Create a new user.
 */
export async function createUser(data: {
    firebaseUid: string;
    phone: string;
    fullName?: string;
}): Promise<UserRow> {
    const result = await query<UserRow>(
        `INSERT INTO users (firebase_uid, phone, full_name, is_phone_verified)
         VALUES ($1, $2, $3, TRUE)
         RETURNING *`,
        [data.firebaseUid, data.phone, data.fullName || null],
    );
    return result.rows[0];
}

/**
 * Get all roles for a user.
 */
export async function getUserRoles(userId: string): Promise<UserRoleRow[]> {
    const result = await query<UserRoleRow>(
        `SELECT ur.role_id, r.name AS role_name, ur.is_active
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = $1 AND ur.is_active = TRUE`,
        [userId],
    );
    return result.rows;
}

/**
 * Assign a role to a user. Ignores if already assigned.
 */
export async function assignRole(userId: string, roleName: string): Promise<void> {
    await query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, r.id FROM roles r WHERE r.name = $2
         ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = TRUE`,
        [userId, roleName],
    );
}

/**
 * Check if a user has a specific role.
 */
export async function userHasRole(userId: string, roleName: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
        `SELECT EXISTS(
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = $1 AND r.name = $2 AND ur.is_active = TRUE
        ) AS exists`,
        [userId, roleName],
    );
    return result.rows[0].exists;
}

// ---- Refresh Token Queries ----

/**
 * Save a refresh token hash to the database.
 */
export async function saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresAt: Date;
}): Promise<void> {
    await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [data.userId, data.tokenHash, data.deviceInfo || null, data.ipAddress || null, data.expiresAt],
    );
}

/**
 * Find a refresh token by its hash.
 */
export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const result = await query<RefreshTokenRow>(
        `SELECT * FROM refresh_tokens
         WHERE token_hash = $1 AND is_revoked = FALSE AND expires_at > NOW()`,
        [tokenHash],
    );
    return result.rows[0] || null;
}

/**
 * Revoke a specific refresh token.
 */
export async function revokeRefreshToken(tokenHash: string): Promise<void> {
    await query(
        `UPDATE refresh_tokens SET is_revoked = TRUE, revoked_at = NOW()
         WHERE token_hash = $1`,
        [tokenHash],
    );
}

/**
 * Revoke ALL refresh tokens for a user (e.g., on password change or forced logout).
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
    await query(
        `UPDATE refresh_tokens SET is_revoked = TRUE, revoked_at = NOW()
         WHERE user_id = $1 AND is_revoked = FALSE`,
        [userId],
    );
}

/**
 * Update the user's last login timestamp.
 */
export async function updateLastLogin(userId: string): Promise<void> {
    await query(
        'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
        [userId],
    );
}

/**
 * B10: Delete expired or revoked refresh tokens.
 * Run periodically (e.g., daily) to keep the table clean.
 */
export async function cleanupExpiredTokens(): Promise<number> {
    const result = await query(
        'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE',
    );
    return result.rowCount ?? 0;
}

// ---- 2Factor OTP Queries ----

/**
 * Create a new user with just a phone number (no Firebase UID).
 * Used for 2Factor SMS OTP authentication.
 */
export async function createUserByPhone(phone: string, fullName?: string): Promise<UserRow> {
    const result = await query<UserRow>(
        `INSERT INTO users (phone, full_name, is_phone_verified, firebase_uid)
         VALUES ($1, $2, TRUE, 'sms_' || gen_random_uuid()::text)
         RETURNING *`,
        [phone, fullName || null],
    );
    return result.rows[0];
}

/**
 * Log an OTP send attempt.
 */
export async function logOtpSend(phone: string, ipAddress?: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await query(
        `INSERT INTO otp_logs (phone, otp_type, ip_address, expires_at)
         VALUES ($1, 'login', $2, $3)`,
        [phone, ipAddress || null, expiresAt],
    );
}

/**
 * Mark the most recent OTP for a phone as verified.
 */
export async function logOtpVerify(phone: string): Promise<void> {
    await query(
        `UPDATE otp_logs
         SET is_verified = TRUE, verified_at = NOW()
         WHERE id = (
             SELECT id FROM otp_logs
             WHERE phone = $1 AND is_verified = FALSE
             ORDER BY created_at DESC
             LIMIT 1
         )`,
        [phone],
    );
}
