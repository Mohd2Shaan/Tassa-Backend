import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/roleGuard';
import { validate } from '../../middlewares/validator';
import * as ctrl from './review.controller';
import { createReviewSchema, vendorReplySchema } from './review.validation';

const router = Router();

// Public
router.get('/restaurant/:restaurantId', ctrl.getRestaurantReviews);

// Customer
router.post('/', authenticate, authorize('CUSTOMER'), validate(createReviewSchema), ctrl.createReview);

// Vendor reply
router.post('/:reviewId/reply', authenticate, authorize('VENDOR'), validate(vendorReplySchema), ctrl.addVendorReply);

export default router;
