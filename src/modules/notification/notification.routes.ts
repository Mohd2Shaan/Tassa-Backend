import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validator';
import * as ctrl from './notification.controller';
import { registerDeviceSchema } from './notification.validation';

const router = Router();
router.use(authenticate);

router.post('/devices', validate(registerDeviceSchema), ctrl.registerDevice);
router.delete('/devices', ctrl.unregisterDevice);
router.get('/', ctrl.getNotifications);
router.patch('/:notificationId/read', ctrl.markAsRead);
router.patch('/read-all', ctrl.markAllAsRead);

export default router;
