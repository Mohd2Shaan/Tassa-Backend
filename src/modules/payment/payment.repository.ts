import { query } from '../../config/database';

// ============================================================
// Payment Repository
// ============================================================

export async function createPayment(data: {
    orderId: string; userId: string; amount: number;
    razorpayOrderId: string;
}) {
    const result = await query(
        `INSERT INTO payments (order_id, user_id, amount, razorpay_order_id, status)
         VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
        [data.orderId, data.userId, data.amount, data.razorpayOrderId],
    );
    return result.rows[0];
}

export async function getPaymentByOrderId(orderId: string) {
    const result = await query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [orderId]);
    return result.rows[0] || null;
}

export async function getPaymentById(paymentId: string) {
    const result = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    return result.rows[0] || null;
}

export async function getPaymentByRazorpayOrderId(razorpayOrderId: string) {
    const result = await query('SELECT * FROM payments WHERE razorpay_order_id = $1', [razorpayOrderId]);
    return result.rows[0] || null;
}

export async function updatePaymentSuccess(paymentId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const result = await query(
        `UPDATE payments SET status = 'captured', razorpay_payment_id = $1,
         razorpay_signature = $2, is_verified = TRUE, verified_at = NOW(),
         verification_method = 'signature', updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [razorpayPaymentId, razorpaySignature, paymentId],
    );
    return result.rows[0] || null;
}

export async function updatePaymentFailed(paymentId: string, reason: string) {
    const result = await query(
        `UPDATE payments SET status = 'failed', failure_reason = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [reason, paymentId],
    );
    return result.rows[0] || null;
}

export async function updatePaymentRefund(paymentId: string, refundId: string, refundAmount: number) {
    const result = await query(
        `UPDATE payments SET status = 'refund_initiated', refund_id = $1, refund_amount = $2,
         refund_status = 'processed', refunded_at = NOW(), updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [refundId, refundAmount, paymentId],
    );
    return result.rows[0] || null;
}
