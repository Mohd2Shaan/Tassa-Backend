import * as reviewRepo from './review.repository';
import * as orderRepo from '../order/order.repository';
import * as vendorRepo from '../vendor/vendor.repository';
import { AppError } from '../../utils/AppError';

export async function createReview(customerId: string, data: Record<string, unknown>) {
    const order = await orderRepo.getOrderById(data.orderId as string);
    if (!order) throw AppError.notFound('Order not found');
    if (order.customer_id !== customerId) throw AppError.forbidden('Not your order');
    if (order.status !== 'delivered') throw AppError.badRequest('Can only review delivered orders');

    const existing = await reviewRepo.getReviewByOrderId(data.orderId as string);
    if (existing) throw AppError.conflict('You have already reviewed this order');

    return reviewRepo.createReview({
        orderId: data.orderId as string,
        customerId,
        restaurantId: order.restaurant_id,
        foodRating: data.foodRating as number,
        deliveryRating: data.deliveryRating as number | undefined,
        reviewText: data.reviewText as string | undefined,
    });
}

export async function getRestaurantReviews(restaurantId: string, page: number, limit: number) {
    return reviewRepo.getRestaurantReviews(restaurantId, page, limit);
}

export async function addVendorReply(userId: string, reviewId: string, reply: string) {
    const review = await reviewRepo.getReviewById(reviewId);
    if (!review) throw AppError.notFound('Review not found');
    const vProfile = await vendorRepo.getVendorProfile(userId);
    if (!vProfile) throw AppError.forbidden('Vendor profile required');
    return reviewRepo.addVendorReply(reviewId, reply);
}
