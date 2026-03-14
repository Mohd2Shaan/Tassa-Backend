import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/roleGuard';
import { validate } from '../../middlewares/validator';
import * as ctrl from './coupon.controller';
import { createCouponSchema, validateCouponSchema } from './coupon.validation';

const router = Router();
router.use(authenticate);

// Customer validates coupon
router.post('/validate', authorize('CUSTOMER'), validate(validateCouponSchema), ctrl.validateCoupon);

// Admin manages coupons
router.post('/', authorize('ADMIN'), validate(createCouponSchema), ctrl.createCoupon);
router.get('/', authorize('ADMIN'), ctrl.listCoupons);
router.delete('/:couponId', authorize('ADMIN'), ctrl.deactivateCoupon);

export default router;
