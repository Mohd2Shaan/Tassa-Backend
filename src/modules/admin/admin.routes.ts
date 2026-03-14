import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/roleGuard';
import * as ctrl from './admin.controller';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Users
router.get('/users', ctrl.getUsers);
router.patch('/users/:userId/status', ctrl.updateUserStatus);

// Vendor approvals
router.get('/vendors/pending', ctrl.getPendingVendors);
router.post('/vendors/:vendorId/approve', ctrl.approveVendor);
router.post('/vendors/:vendorId/reject', ctrl.rejectVendor);

// Delivery partner approvals
router.get('/delivery-partners/pending', ctrl.getPendingDeliveryPartners);
router.post('/delivery-partners/:partnerId/approve', ctrl.approveDeliveryPartner);
router.post('/delivery-partners/:partnerId/reject', ctrl.rejectDeliveryPartner);

// Orders
router.get('/orders', ctrl.getAllOrders);

export default router;
