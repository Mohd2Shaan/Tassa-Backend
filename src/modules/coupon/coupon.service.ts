import * as couponRepo from './coupon.repository';
import { AppError } from '../../utils/AppError';

export async function createCoupon(adminId: string, data: Record<string, unknown>) {
    return couponRepo.createCoupon({ ...data, createdBy: adminId });
}

export async function validateCoupon(userId: string, code: string, restaurantId: string, orderAmount: number) {
    const coupon = await couponRepo.getCouponByCode(code.toUpperCase());
    if (!coupon) throw AppError.notFound('Coupon not found or expired');

    const now = new Date();
    if (new Date(coupon.valid_from) > now) throw AppError.badRequest('Coupon is not yet valid');
    if (new Date(coupon.valid_until) < now) throw AppError.badRequest('Coupon has expired');
    if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
        throw AppError.badRequest(`Minimum order amount is ₹${(coupon.min_order_amount / 100).toFixed(2)}`);
    }
    if (coupon.restaurant_id && coupon.restaurant_id !== restaurantId) {
        throw AppError.badRequest('This coupon is not valid for this restaurant');
    }
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        throw AppError.badRequest('Coupon usage limit reached');
    }

    const userUsage = await couponRepo.getCouponUsageCount(coupon.id, userId);
    if (userUsage >= coupon.max_uses_per_user) {
        throw AppError.badRequest('You have already used this coupon the maximum number of times');
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
        discount = Math.round(orderAmount * coupon.discount_value / 100);
        if (coupon.max_discount_amount) discount = Math.min(discount, coupon.max_discount_amount);
    } else {
        discount = coupon.discount_value;
    }

    return { couponId: coupon.id, code: coupon.code, discountType: coupon.discount_type, discount };
}

export async function listCoupons(page: number, limit: number) {
    return couponRepo.getAllCoupons(page, limit);
}

export async function deactivateCoupon(couponId: string) {
    await couponRepo.deactivateCoupon(couponId);
}
