import { query } from '../../config/database';

// ============================================================
// Notification Repository
// ============================================================

export async function saveDeviceToken(userId: string, fcmToken: string, deviceType: string, deviceId?: string) {
    const result = await query(
        `INSERT INTO device_tokens (user_id, fcm_token, device_type, device_model)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, fcm_token) DO UPDATE SET device_type = $3, is_active = TRUE, updated_at = NOW()
         RETURNING *`,
        [userId, fcmToken, deviceType, deviceId || null],
    );
    return result.rows[0];
}

export async function getUserDeviceTokens(userId: string): Promise<string[]> {
    const result = await query(
        `SELECT fcm_token FROM device_tokens WHERE user_id = $1 AND is_active = TRUE`,
        [userId],
    );
    return result.rows.map(r => r.fcm_token);
}

export async function createNotification(userId: string, title: string, body: string, type: string, data?: Record<string, unknown>) {
    const result = await query(
        `INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, title, body, type, data ? JSON.stringify(data) : null],
    );
    return result.rows[0];
}

export async function getUserNotifications(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const count = await query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [userId]);
    const result = await query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
    );
    return { notifications: result.rows, total: parseInt(count.rows[0].count) };
}

export async function markAsRead(notificationId: string, userId: string) {
    await query(
        `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2`,
        [notificationId, userId],
    );
}

export async function markAllAsRead(userId: string) {
    await query(
        'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE',
        [userId],
    );
}

export async function removeDeviceToken(userId: string, fcmToken: string) {
    await query('DELETE FROM device_tokens WHERE user_id = $1 AND fcm_token = $2', [userId, fcmToken]);
}

/**
 * Update notification sent status after FCM push attempt.
 */
export async function updateNotificationSentStatus(
    notificationId: string,
    isSent: boolean,
    sendError?: string,
) {
    await query(
        `UPDATE notifications SET is_sent = $2, sent_at = CASE WHEN $2 THEN NOW() ELSE sent_at END, send_error = $3
         WHERE id = $1`,
        [notificationId, isSent, sendError || null],
    );
}

/**
 * Deactivate a stale/invalid FCM device token.
 */
export async function deactivateDeviceToken(userId: string, fcmToken: string) {
    await query(
        'UPDATE device_tokens SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1 AND fcm_token = $2',
        [userId, fcmToken],
    );
}
