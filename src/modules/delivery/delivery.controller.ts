import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as deliveryService from './delivery.service';

// ============================================================
// Delivery Controller
// ============================================================

export const register = asyncHandler(async (req: Request, res: Response) => {
    const profile = await deliveryService.registerAsDeliveryPartner(req.user!.userId, req.body);
    ApiResponse.created(res, profile, 'Delivery partner registration submitted');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await deliveryService.getProfile(req.user!.userId);
    ApiResponse.success(res, profile, 'Profile retrieved');
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const result = await deliveryService.updateLocation(req.user!.userId, req.body.latitude, req.body.longitude);
    ApiResponse.success(res, result, 'Location updated');
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
    const result = await deliveryService.toggleAvailability(req.user!.userId, req.body.isAvailable);
    ApiResponse.success(res, result, `Availability set to ${req.body.isAvailable}`);
});

export const getActiveDeliveries = asyncHandler(async (req: Request, res: Response) => {
    const deliveries = await deliveryService.getActiveDeliveries(req.user!.userId);
    ApiResponse.success(res, deliveries, 'Active deliveries retrieved');
});

export const updateDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
    const { action, ...extra } = req.body;
    const delivery = await deliveryService.updateDeliveryStatus(
        req.user!.userId, String(req.params.deliveryId), action, extra,
    );
    ApiResponse.success(res, delivery, 'Delivery status updated');
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await deliveryService.getDeliveryHistory(req.user!.userId, page, limit);
    ApiResponse.success(res, result, 'Delivery history retrieved');
});
