import * as vendorRepo from './vendor.repository';
import { AppError } from '../../utils/AppError';
import { ROLES } from '../../utils/constants';
import { assignRole } from '../auth/auth.repository';

// ============================================================
// Vendor Service
// ============================================================

// ---- Vendor Profile ----

export async function registerAsVendor(userId: string, data: Record<string, unknown>) {
    const existing = await vendorRepo.getVendorProfile(userId);
    if (existing) throw AppError.conflict('You are already registered as a vendor');

    // Assign VENDOR role
    await assignRole(userId, ROLES.VENDOR);
    return vendorRepo.createVendorProfile(userId, data);
}

export async function getVendorProfile(userId: string) {
    const profile = await vendorRepo.getVendorProfile(userId);
    if (!profile) throw AppError.notFound('Vendor profile not found. Please register as a vendor first.');
    return profile;
}

export async function updateVendorProfile(userId: string, data: Record<string, unknown>) {
    const updated = await vendorRepo.updateVendorProfile(userId, data);
    if (!updated) throw AppError.notFound('Vendor profile not found or no fields to update');
    return updated;
}

// ---- Restaurant ----

async function ensureVendor(userId: string) {
    const profile = await vendorRepo.getVendorProfile(userId);
    if (!profile) throw AppError.forbidden('Register as a vendor first');
    if (profile.approval_status !== 'approved' && profile.approval_status !== 'pending') {
        throw AppError.forbidden(`Your vendor application is ${profile.approval_status}`);
    }
    return profile;
}

async function ensureRestaurantOwner(restaurantId: string, vendorProfileId: string) {
    const restaurant = await vendorRepo.getRestaurantById(restaurantId);
    if (!restaurant) throw AppError.notFound('Restaurant not found');
    if (restaurant.vendor_id !== vendorProfileId) throw AppError.forbidden('You do not own this restaurant');
    return restaurant;
}

export async function getMyRestaurants(userId: string) {
    const profile = await ensureVendor(userId);
    return vendorRepo.getVendorRestaurants(profile.id);
}

export async function createRestaurant(userId: string, data: Record<string, unknown>) {
    const profile = await ensureVendor(userId);
    return vendorRepo.createRestaurant(profile.id, data);
}

export async function updateRestaurant(userId: string, restaurantId: string, data: Record<string, unknown>) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    const updated = await vendorRepo.updateRestaurant(restaurantId, data);
    if (!updated) throw AppError.badRequest('No fields to update');
    return updated;
}

export async function getRestaurant(restaurantId: string) {
    const restaurant = await vendorRepo.getRestaurantById(restaurantId);
    if (!restaurant) throw AppError.notFound('Restaurant not found');
    return restaurant;
}

// ---- Menu Categories ----

export async function getCategories(userId: string, restaurantId: string) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    return vendorRepo.getCategories(restaurantId);
}

export async function createCategory(userId: string, restaurantId: string, data: Record<string, unknown>) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    return vendorRepo.createCategory(restaurantId, data);
}

export async function updateCategory(userId: string, restaurantId: string, categoryId: string, data: Record<string, unknown>) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    const updated = await vendorRepo.updateCategory(categoryId, restaurantId, data);
    if (!updated) throw AppError.notFound('Category not found');
    return updated;
}

export async function deleteCategory(userId: string, restaurantId: string, categoryId: string) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    const deleted = await vendorRepo.deleteCategory(categoryId, restaurantId);
    if (!deleted) throw AppError.notFound('Category not found');
}

// ---- Menu Items ----

export async function getMenuItems(userId: string, restaurantId: string, categoryId: string) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    return vendorRepo.getMenuItems(restaurantId, categoryId);
}

export async function createMenuItem(userId: string, restaurantId: string, categoryId: string, data: Record<string, unknown>) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    return vendorRepo.createMenuItem(restaurantId, categoryId, data);
}

export async function updateMenuItem(userId: string, restaurantId: string, itemId: string, data: Record<string, unknown>) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    const updated = await vendorRepo.updateMenuItem(itemId, data);
    if (!updated) throw AppError.notFound('Menu item not found');
    return updated;
}

export async function deleteMenuItem(userId: string, restaurantId: string, itemId: string) {
    const profile = await ensureVendor(userId);
    await ensureRestaurantOwner(restaurantId, profile.id);
    const deleted = await vendorRepo.deleteMenuItem(itemId);
    if (!deleted) throw AppError.notFound('Menu item not found');
}

// ---- Public ----

export async function browseRestaurants(city: string, page: number, limit: number, lat: number = 0, lng: number = 0) {
    return vendorRepo.getActiveRestaurants(city, page, limit, lat, lng);
}

export async function getRestaurantMenu(restaurantId: string) {
    const restaurant = await vendorRepo.getRestaurantById(restaurantId);
    if (!restaurant) throw AppError.notFound('Restaurant not found');
    return vendorRepo.getRestaurantMenu(restaurantId);
}

export async function browseItemsByCategory(keyword: string, lat: number, lng: number, limit: number) {
    return vendorRepo.browseItemsByCategory(keyword, lat, lng, limit);
}
