import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/roleGuard';
import { validate } from '../../middlewares/validator';
import * as ctrl from './delivery.controller';
import * as val from './delivery.validation';

const router = Router();
router.use(authenticate);

// Registration (any authenticated user)
router.post('/profile', validate(val.registerDeliveryPartnerSchema), ctrl.register);

// All below require DELIVERY_PARTNER role
router.get('/profile', authorize('DELIVERY_PARTNER'), ctrl.getProfile);
router.post('/location', authorize('DELIVERY_PARTNER'), validate(val.updateLocationSchema), ctrl.updateLocation);
router.patch('/availability', authorize('DELIVERY_PARTNER'), validate(val.toggleAvailabilitySchema), ctrl.toggleAvailability);
router.get('/active', authorize('DELIVERY_PARTNER'), ctrl.getActiveDeliveries);
router.post('/:deliveryId/action', authorize('DELIVERY_PARTNER'), validate(val.deliveryActionSchema), ctrl.updateDeliveryStatus);
router.get('/history', authorize('DELIVERY_PARTNER'), ctrl.getHistory);

export default router;
