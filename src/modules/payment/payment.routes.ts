import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/roleGuard';
import { validate } from '../../middlewares/validator';
import { paymentLimiter, webhookLimiter } from '../../middlewares/rateLimiter';
import * as ctrl from './payment.controller';
import * as val from './payment.validation';

const router = Router();

// Razorpay webhook (no auth — verified by signature, rate-limited to prevent abuse)
router.post('/webhook', webhookLimiter, ctrl.handleWebhook);

// Protected routes
router.use(authenticate);
router.post('/create-order', paymentLimiter, authorize('CUSTOMER'), validate(val.createPaymentOrderSchema), ctrl.createPaymentOrder);
router.post('/verify', paymentLimiter, authorize('CUSTOMER'), validate(val.verifyPaymentSchema), ctrl.verifyPayment);
router.post('/:paymentId/refund', authorize('ADMIN'), validate(val.refundSchema), ctrl.initiateRefund);

export default router;
