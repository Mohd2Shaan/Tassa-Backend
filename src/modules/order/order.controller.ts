import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as orderService from './order.service';

// ============================================================
// Order Controller
// ============================================================

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.createOrder(req.user!.userId, req.body);
    ApiResponse.created(res, order, 'Order placed successfully');
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrder(String(req.params.orderId), req.user!.userId);
    ApiResponse.success(res, order, 'Order retrieved');
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.updateOrderStatus(
        String(req.params.orderId), req.body.status, req.user!.userId, req.body.reason,
    );
    ApiResponse.success(res, order, 'Order status updated');
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await orderService.getMyOrders(req.user!.userId, page, limit);
    ApiResponse.success(res, result, 'Orders retrieved');
});

export const getRestaurantOrders = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = (req.query.status as string) || null;
    const result = await orderService.getRestaurantOrders(
        req.user!.userId, String(req.params.restaurantId), status, page, limit,
    );
    ApiResponse.success(res, result, 'Restaurant orders retrieved');
});
