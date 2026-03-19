import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/roleGuard';
import { validate } from '../../middlewares/validator';
import * as ctrl from './order.controller';
import * as val from './order.validation';

const router = Router();

// Public
router.get('/trending-products', ctrl.getTrendingProducts);

router.use(authenticate);

// Customer
router.post('/', authorize('CUSTOMER'), validate(val.createOrderSchema), ctrl.createOrder);
router.get('/my', authorize('CUSTOMER'), ctrl.getMyOrders);

// Shared (customer + vendor can view)
router.get('/:orderId', validate(val.orderIdParamSchema), ctrl.getOrder);

// Vendor (status updates)
router.patch('/:orderId/status', authorize('VENDOR', 'ADMIN'), validate(val.updateOrderStatusSchema), ctrl.updateOrderStatus);

// Vendor order coordination
router.post('/:orderId/accept', authorize('VENDOR'), ctrl.acceptOrderByVendor);
router.post('/:orderId/food-ready', authorize('VENDOR'), ctrl.markFoodReady);

// Vendor restaurant orders
router.get('/restaurant/:restaurantId', authorize('VENDOR'), ctrl.getRestaurantOrders);

export default router;
