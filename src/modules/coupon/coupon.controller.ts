import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as couponService from './coupon.service';

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await couponService.createCoupon(req.user!.userId, req.body);
    ApiResponse.created(res, coupon, 'Coupon created');
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
    const result = await couponService.validateCoupon(
        req.user!.userId, req.body.code, req.body.restaurantId, req.body.orderAmount,
    );
    ApiResponse.success(res, result, 'Coupon is valid');
});

export const listCoupons = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await couponService.listCoupons(page, limit);
    ApiResponse.success(res, result, 'Coupons retrieved');
});

export const deactivateCoupon = asyncHandler(async (req: Request, res: Response) => {
    await couponService.deactivateCoupon(String(req.params.couponId));
    ApiResponse.success(res, null, 'Coupon deactivated');
});
