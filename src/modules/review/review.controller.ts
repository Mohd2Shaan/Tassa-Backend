import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as reviewService from './review.service';

export const createReview = asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewService.createReview(req.user!.userId, req.body);
    ApiResponse.created(res, review, 'Review submitted');
});

export const getRestaurantReviews = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await reviewService.getRestaurantReviews(String(req.params.restaurantId), page, limit);
    ApiResponse.success(res, result, 'Reviews retrieved');
});

export const addVendorReply = asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewService.addVendorReply(req.user!.userId, String(req.params.reviewId), req.body.reply);
    ApiResponse.success(res, review, 'Reply added');
});
