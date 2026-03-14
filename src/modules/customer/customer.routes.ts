import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/roleGuard';
import { validate } from '../../middlewares/validator';
import * as ctrl from './customer.controller';
import { updateProfileSchema, createAddressSchema, updateAddressSchema, addressIdParamSchema } from './customer.validation';

const router = Router();

// All customer routes require authentication + CUSTOMER role
router.use(authenticate, authorize('CUSTOMER'));

// Profile
router.patch('/profile', validate(updateProfileSchema), ctrl.updateProfile);

// Addresses
router.get('/addresses', ctrl.getAddresses);
router.get('/addresses/:addressId', validate(addressIdParamSchema), ctrl.getAddress);
router.post('/addresses', validate(createAddressSchema), ctrl.createAddress);
router.patch('/addresses/:addressId', validate(updateAddressSchema), ctrl.updateAddress);
router.delete('/addresses/:addressId', validate(addressIdParamSchema), ctrl.deleteAddress);

export default router;
