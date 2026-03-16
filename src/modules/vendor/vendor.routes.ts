import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/roleGuard';
import { validate } from '../../middlewares/validator';
import * as ctrl from './vendor.controller';
import * as val from './vendor.validation';

const router = Router();

// ---- Public routes (browsing) ----
router.get('/restaurants/browse', ctrl.browseRestaurants);
router.get('/restaurants/browse-items', ctrl.browseItems);
router.get('/restaurants/:restaurantId/menu', validate(val.restaurantIdParamSchema), ctrl.getRestaurantMenu);
router.get('/restaurants/:restaurantId/public', validate(val.restaurantIdParamSchema), ctrl.getRestaurant);

// ---- Protected vendor routes ----
router.use(authenticate);

// Vendor profile (any authenticated user can register as vendor)
router.post('/profile', validate(val.registerVendorSchema), ctrl.registerVendor);
router.get('/profile', authorize('VENDOR'), ctrl.getVendorProfile);
router.patch('/profile', authorize('VENDOR'), validate(val.updateVendorProfileSchema), ctrl.updateVendorProfile);

// Restaurants (vendor only)
router.get('/restaurants', authorize('VENDOR'), ctrl.getMyRestaurants);
router.post('/restaurants', authorize('VENDOR'), validate(val.createRestaurantSchema), ctrl.createRestaurant);
router.patch('/restaurants/:restaurantId', authorize('VENDOR'), validate(val.updateRestaurantSchema), ctrl.updateRestaurant);

// Menu categories
router.get('/restaurants/:restaurantId/categories', authorize('VENDOR'), validate(val.restaurantIdParamSchema), ctrl.getCategories);
router.post('/restaurants/:restaurantId/categories', authorize('VENDOR'), validate(val.createCategorySchema), ctrl.createCategory);
router.patch('/restaurants/:restaurantId/categories/:categoryId', authorize('VENDOR'), validate(val.updateCategorySchema), ctrl.updateCategory);
router.delete('/restaurants/:restaurantId/categories/:categoryId', authorize('VENDOR'), validate(val.updateCategorySchema), ctrl.deleteCategory);

// Menu items
router.get('/restaurants/:restaurantId/categories/:categoryId/items', authorize('VENDOR'), validate(val.createMenuItemSchema), ctrl.getMenuItems);
router.post('/restaurants/:restaurantId/categories/:categoryId/items', authorize('VENDOR'), validate(val.createMenuItemSchema), ctrl.createMenuItem);
router.patch('/restaurants/:restaurantId/items/:itemId', authorize('VENDOR'), validate(val.updateMenuItemSchema), ctrl.updateMenuItem);
router.delete('/restaurants/:restaurantId/items/:itemId', authorize('VENDOR'), ctrl.deleteMenuItem);

export default router;
