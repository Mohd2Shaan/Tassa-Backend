import { query } from '../../config/database';

export async function createReview(data: {
    orderId: string; customerId: string; restaurantId: string;
    foodRating: number; deliveryRating?: number; reviewText?: string;
}) {
    const result = await query(
        `INSERT INTO reviews (order_id, customer_id, restaurant_id, food_rating, delivery_rating, review_text)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [data.orderId, data.customerId, data.restaurantId, data.foodRating, data.deliveryRating || null, data.reviewText || null],
    );
    // Update restaurant average rating
    await query(
        `UPDATE restaurants SET rating_avg = (SELECT AVG(food_rating) FROM reviews WHERE restaurant_id = $1),
         rating_count = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1) WHERE id = $1`,
        [data.restaurantId],
    );
    return result.rows[0];
}

export async function getReviewByOrderId(orderId: string) {
    const result = await query('SELECT * FROM reviews WHERE order_id = $1', [orderId]);
    return result.rows[0] || null;
}

export async function getRestaurantReviews(restaurantId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const count = await query('SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1', [restaurantId]);
    const result = await query(
        `SELECT r.*, u.full_name AS customer_name FROM reviews r
         JOIN users u ON u.id = r.customer_id
         WHERE r.restaurant_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
        [restaurantId, limit, offset],
    );
    return { reviews: result.rows, total: parseInt(count.rows[0].count) };
}

export async function addVendorReply(reviewId: string, reply: string) {
    const result = await query(
        `UPDATE reviews SET vendor_reply = $1, vendor_replied_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`,
        [reply, reviewId],
    );
    return result.rows[0] || null;
}

export async function getReviewById(reviewId: string) {
    const result = await query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    return result.rows[0] || null;
}
