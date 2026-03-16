import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as vendorService from './vendor.service';

// ============================================================
// Vendor Controller
// ============================================================

// ---- Vendor Profile ----
export const registerVendor = asyncHandler(async (req: Request, res: Response) => {
    const profile = await vendorService.registerAsVendor(req.user!.userId, req.body);
    ApiResponse.created(res, profile, 'Vendor registration submitted');
});

export const getVendorProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await vendorService.getVendorProfile(req.user!.userId);
    ApiResponse.success(res, profile, 'Vendor profile retrieved');
});

export const updateVendorProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await vendorService.updateVendorProfile(req.user!.userId, req.body);
    ApiResponse.success(res, profile, 'Vendor profile updated');
});

// ---- Restaurant ----
export const getMyRestaurants = asyncHandler(async (req: Request, res: Response) => {
    const restaurants = await vendorService.getMyRestaurants(req.user!.userId);
    ApiResponse.success(res, restaurants, 'Restaurants retrieved');
});

export const createRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await vendorService.createRestaurant(req.user!.userId, req.body);
    ApiResponse.created(res, restaurant, 'Restaurant created');
});

export const updateRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await vendorService.updateRestaurant(req.user!.userId, String(req.params.restaurantId), req.body);
    ApiResponse.success(res, restaurant, 'Restaurant updated');
});

export const getRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const restaurant = await vendorService.getRestaurant(String(req.params.restaurantId));
    ApiResponse.success(res, restaurant, 'Restaurant retrieved');
});

// ---- Menu Categories ----
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await vendorService.getCategories(req.user!.userId, String(req.params.restaurantId));
    ApiResponse.success(res, categories, 'Categories retrieved');
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await vendorService.createCategory(req.user!.userId, String(req.params.restaurantId), req.body);
    ApiResponse.created(res, category, 'Category created');
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await vendorService.updateCategory(
        req.user!.userId, String(req.params.restaurantId), String(req.params.categoryId), req.body,
    );
    ApiResponse.success(res, category, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    await vendorService.deleteCategory(req.user!.userId, String(req.params.restaurantId), String(req.params.categoryId));
    ApiResponse.success(res, null, 'Category deleted');
});

// ---- Menu Items ----
export const getMenuItems = asyncHandler(async (req: Request, res: Response) => {
    const items = await vendorService.getMenuItems(
        req.user!.userId, String(req.params.restaurantId), String(req.params.categoryId),
    );
    ApiResponse.success(res, items, 'Menu items retrieved');
});

export const createMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const item = await vendorService.createMenuItem(
        req.user!.userId, String(req.params.restaurantId), String(req.params.categoryId), req.body,
    );
    ApiResponse.created(res, item, 'Menu item created');
});

export const updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const item = await vendorService.updateMenuItem(
        req.user!.userId, String(req.params.restaurantId), String(req.params.itemId), req.body,
    );
    ApiResponse.success(res, item, 'Menu item updated');
});

export const deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
    await vendorService.deleteMenuItem(req.user!.userId, String(req.params.restaurantId), String(req.params.itemId));
    ApiResponse.success(res, null, 'Menu item deleted');
});

// ---- Public ----
export const browseRestaurants = asyncHandler(async (req: Request, res: Response) => {
    const city = (req.query.city as string) || '';
    const lat = parseFloat(req.query.lat as string) || 0;
    const lng = parseFloat(req.query.lng as string) || 0;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await vendorService.browseRestaurants(city, page, limit, lat, lng);
    ApiResponse.success(res, result, 'Restaurants retrieved');
});

export const getRestaurantMenu = asyncHandler(async (req: Request, res: Response) => {
    const menu = await vendorService.getRestaurantMenu(String(req.params.restaurantId));
    ApiResponse.success(res, menu, 'Restaurant menu retrieved');
});

export const browseItems = asyncHandler(async (req: Request, res: Response) => {
    const category = (req.query.category as string) || '';
    const lat = parseFloat(req.query.lat as string) || 0;
    const lng = parseFloat(req.query.lng as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const items = await vendorService.browseItemsByCategory(category, lat, lng, limit);
    ApiResponse.success(res, items, 'Items retrieved');
});
