import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as paymentService from './payment.service';

// ============================================================
// Payment Controller
// ============================================================

export const createPaymentOrder = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.createPaymentOrder(req.body.orderId, req.user!.userId);
    ApiResponse.success(res, result, 'Payment order created');
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.verifyPayment(
        req.body.orderId, req.body.razorpayOrderId,
        req.body.razorpayPaymentId, req.body.razorpaySignature,
    );
    ApiResponse.success(res, result, 'Payment verified');
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    await paymentService.handleWebhook(req.body, signature);
    ApiResponse.success(res, null, 'Webhook processed');
});

export const initiateRefund = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.initiateRefund(String(req.params.paymentId), req.body.reason, req.body.amount);
    ApiResponse.success(res, result, 'Refund initiated');
});
