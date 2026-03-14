import { z } from 'zod';

// ============================================================
// Payment Validation Schemas
// ============================================================

export const createPaymentOrderSchema = {
    body: z.object({
        orderId: z.string().uuid(),
    }),
};

export const verifyPaymentSchema = {
    body: z.object({
        orderId: z.string().uuid(),
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
    }),
};

export const refundSchema = {
    params: z.object({ paymentId: z.string().uuid() }),
    body: z.object({
        reason: z.string().min(5).max(500),
        amount: z.number().int().positive().optional(), // partial refund (in paisa)
    }),
};
