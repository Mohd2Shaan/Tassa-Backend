import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as notifService from './notification.service';

export const registerDevice = asyncHandler(async (req: Request, res: Response) => {
    const token = await notifService.registerDevice(req.user!.userId, req.body.fcmToken, req.body.deviceType, req.body.deviceId);
    ApiResponse.success(res, token, 'Device registered');
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await notifService.getNotifications(req.user!.userId, page, limit);
    ApiResponse.success(res, result, 'Notifications retrieved');
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
    await notifService.markAsRead(String(req.params.notificationId), req.user!.userId);
    ApiResponse.success(res, null, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await notifService.markAllAsRead(req.user!.userId);
    ApiResponse.success(res, null, 'All notifications marked as read');
});

export const unregisterDevice = asyncHandler(async (req: Request, res: Response) => {
    const { fcmToken } = req.body;
    if (!fcmToken) {
        ApiResponse.success(res, null, 'No token provided');
        return;
    }
    await notifService.removeDevice(req.user!.userId, fcmToken);
    ApiResponse.success(res, null, 'Device unregistered');
});
