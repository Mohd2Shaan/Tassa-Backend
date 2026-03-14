import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import * as paymentRepo from './payment.repository';
import * as orderRepo from '../order/order.repository';
import { logger } from '../../config/logger';

// ============================================================
// Payment Service (Razorpay Integration)
// ============================================================

let _razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
    if (!_razorpay) {
        if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
            throw AppError.badRequest(
                'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env',
            );
        }
        _razorpay = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_KEY_SECRET,
        });
    }
    return _razorpay;
}

/**
 * Create a Razorpay order for a Tassa order.
 */
export async function createPaymentOrder(orderId: string, userId: string) {
    const order = await orderRepo.getOrderById(orderId);
    if (!order) throw AppError.notFound('Order not found');
    if (order.customer_id !== userId) throw AppError.forbidden('Not your order');
    if (order.status !== 'pending') throw AppError.badRequest('Order is not in a payable state');

    // Check for existing payment
    const existingPayment = await paymentRepo.getPaymentByOrderId(orderId);
    if (existingPayment && existingPayment.status === 'completed') {
        throw AppError.conflict('Payment already completed for this order');
    }

    // Create Razorpay order
    const rzpOrder = await getRazorpay().orders.create({
        amount: order.total_amount, // already in paisa
        currency: 'INR',
        receipt: orderId,
        notes: { orderId, userId },
    });

    // Save payment record
    const payment = await paymentRepo.createPayment({
        orderId,
        userId,
        amount: order.total_amount,
        razorpayOrderId: rzpOrder.id,
    });

    return {
        paymentId: payment.id,
        razorpayOrderId: rzpOrder.id,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
        amount: order.total_amount,
        currency: 'INR',
    };
}

/**
 * Verify Razorpay payment signature (server-side).
 */
export async function verifyPayment(
    orderId: string, razorpayOrderId: string,
    razorpayPaymentId: string, razorpaySignature: string,
) {
    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature))) {
        logger.warn('Payment signature verification failed', { orderId, razorpayOrderId });
        throw AppError.badRequest('Payment verification failed. Invalid signature.');
    }

    // Update payment
    const payment = await paymentRepo.getPaymentByRazorpayOrderId(razorpayOrderId);
    if (!payment) throw AppError.notFound('Payment record not found');

    await paymentRepo.updatePaymentSuccess(payment.id, razorpayPaymentId, razorpaySignature);

    // Update order status to confirmed
    await orderRepo.updateOrderStatus(orderId, 'confirmed', 'pending', payment.user_id, 'payment', 'Payment verified');

    return { status: 'success', paymentId: payment.id };
}

/**
 * Handle Razorpay webhook (backup payment confirmation).
 */
export async function handleWebhook(body: Record<string, unknown>, signature: string) {
    // Verify webhook signature
    const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
        throw AppError.unauthorized('Invalid webhook signature');
    }

    const event = body.event as string;
    const payload = body.payload as Record<string, unknown>;

    if (event === 'payment.captured') {
        const rzpPayment = (payload.payment as Record<string, unknown>).entity as Record<string, unknown>;
        const rzpOrderId = rzpPayment.order_id as string;
        const rzpPaymentId = rzpPayment.id as string;

        const payment = await paymentRepo.getPaymentByRazorpayOrderId(rzpOrderId);
        if (payment && payment.status !== 'completed') {
            await paymentRepo.updatePaymentSuccess(payment.id, rzpPaymentId, '');
            await orderRepo.updateOrderStatus(payment.order_id, 'confirmed', 'pending', payment.user_id, 'payment', 'Payment captured (webhook)');
        }
    } else if (event === 'payment.failed') {
        const rzpPayment = (payload.payment as Record<string, unknown>).entity as Record<string, unknown>;
        const rzpOrderId = rzpPayment.order_id as string;

        const payment = await paymentRepo.getPaymentByRazorpayOrderId(rzpOrderId);
        if (payment && payment.status === 'pending') {
            const errorDesc = (rzpPayment.error_description as string) || 'Payment failed';
            await paymentRepo.updatePaymentFailed(payment.id, errorDesc);
        }
    }

    logger.info('Razorpay webhook processed', { event });
}

/**
 * Initiate a refund.
 */
export async function initiateRefund(paymentId: string, reason: string, amount?: number) {
    const payment = await paymentRepo.getPaymentById(paymentId);
    if (!payment) throw AppError.notFound('Payment not found');
    if (payment.status !== 'completed') throw AppError.badRequest('Only completed payments can be refunded');

    const refundAmount = amount || payment.amount;

    const refund = await getRazorpay().payments.refund(payment.razorpay_payment_id, {
        amount: refundAmount,
        notes: { reason, paymentId },
    });

    await paymentRepo.updatePaymentRefund(paymentId, refund.id, refundAmount);
    await orderRepo.updateOrderStatus(payment.order_id, 'refund_initiated', payment.status || 'captured', payment.user_id, 'payment', reason);

    return { refundId: refund.id, amount: refundAmount };
}
