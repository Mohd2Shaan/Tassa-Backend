import admin from 'firebase-admin';
import * as notifRepo from './notification.repository';
import { logger } from '../../config/logger';

// ============================================================
// Notification Service
// ============================================================

export async function registerDevice(userId: string, fcmToken: string, deviceType: string, deviceId?: string) {
    return notifRepo.saveDeviceToken(userId, fcmToken, deviceType, deviceId);
}

/**
 * Send a push notification to a user via Firebase Cloud Messaging.
 * 1. Save notification to DB
 * 2. Get user's active FCM tokens
 * 3. Send via firebase-admin messaging
 * 4. Handle stale tokens
 */
export async function sendNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, string>,
) {
    // Save to DB
    const notification = await notifRepo.createNotification(userId, title, body, type, data);

    // Get user's FCM tokens and send via Firebase
    const tokens = await notifRepo.getUserDeviceTokens(userId);
    if (tokens.length === 0) {
        logger.info('No device tokens found for user, skipping push', { userId });
        return notification;
    }

    try {
        const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: { title, body },
            data: data || {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'tassa_orders',
                },
            },
            apns: {
                payload: {
                    aps: { sound: 'default', badge: 1 },
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        logger.info('Push notification sent', {
            userId,
            title,
            successCount: response.successCount,
            failureCount: response.failureCount,
        });

        // Track sent status
        if (response.successCount > 0) {
            await notifRepo.updateNotificationSentStatus(notification.id, true);
        }

        // Handle stale/invalid tokens
        if (response.failureCount > 0) {
            const staleTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (resp.error) {
                    const code = resp.error.code;
                    // These codes indicate the token is no longer valid
                    if (
                        code === 'messaging/registration-token-not-registered' ||
                        code === 'messaging/invalid-registration-token' ||
                        code === 'messaging/invalid-argument'
                    ) {
                        staleTokens.push(tokens[idx]);
                    }
                    logger.warn('FCM send error for token', {
                        userId,
                        tokenIndex: idx,
                        errorCode: code,
                        errorMessage: resp.error.message,
                    });
                }
            });

            // Deactivate stale tokens
            for (const staleToken of staleTokens) {
                await notifRepo.deactivateDeviceToken(userId, staleToken);
                logger.info('Deactivated stale FCM token', { userId });
            }
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Failed to send push notification', { userId, error: errorMessage });
        await notifRepo.updateNotificationSentStatus(notification.id, false, errorMessage);
    }

    return notification;
}

export async function getNotifications(userId: string, page: number, limit: number) {
    return notifRepo.getUserNotifications(userId, page, limit);
}

export async function markAsRead(notificationId: string, userId: string) {
    return notifRepo.markAsRead(notificationId, userId);
}

export async function markAllAsRead(userId: string) {
    return notifRepo.markAllAsRead(userId);
}

export async function removeDevice(userId: string, fcmToken: string) {
    return notifRepo.removeDeviceToken(userId, fcmToken);
}
