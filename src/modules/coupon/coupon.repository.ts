import { query } from '../../config/database';

export async function createCoupon(data: Record<string, unknown>) {
    const result = await query(
        `INSERT INTO coupons (code, description, discount_type, discount_value, max_discount,
         min_order_amount, max_uses_total, max_uses_per_user, valid_from, valid_until, restaurant_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [data.code, data.description || null, data.discountType, data.discountValue,
        data.maxDiscount || data.maxDiscountAmount || null, data.minOrderAmount || 0,
        data.maxUsesTotal || data.maxUses || null,
        data.maxUsesPerUser || 1, data.validFrom, data.validUntil,
        data.restaurantId || null, data.createdBy],
    );
    return result.rows[0];
}

export async function getCouponByCode(code: string) {
    const result = await query(
        `SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE`, [code],
    );
    return result.rows[0] || null;
}

export async function getCouponUsageCount(couponId: string, userId: string) {
    const result = await query(
        'SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
        [couponId, userId],
    );
    return parseInt(result.rows[0].count);
}

export async function getAllCoupons(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const count = await query('SELECT COUNT(*) FROM coupons');
    const result = await query('SELECT * FROM coupons ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    return { coupons: result.rows, total: parseInt(count.rows[0].count) };
}

export async function deactivateCoupon(couponId: string) {
    await query('UPDATE coupons SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [couponId]);
}
