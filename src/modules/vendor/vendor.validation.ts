import { z } from 'zod';

// ============================================================
// Vendor Validation Schemas
// ============================================================

// ---- Vendor Profile ----
export const registerVendorSchema = {
    body: z.object({
        businessName: z.string().min(2).max(150),
        fssaiLicense: z.string().max(20).optional(),
        gstNumber: z.string().max(20).optional(),
        panNumber: z.string().max(12).optional(),
        bankAccountNo: z.string().max(20).optional(),
        bankIfsc: z.string().max(15).optional(),
        bankName: z.string().max(100).optional(),
    }),
};

export const updateVendorProfileSchema = {
    body: z.object({
        businessName: z.string().min(2).max(150).optional(),
        fssaiLicense: z.string().max(20).optional(),
        gstNumber: z.string().max(20).optional(),
        panNumber: z.string().max(12).optional(),
        bankAccountNo: z.string().max(20).optional(),
        bankIfsc: z.string().max(15).optional(),
        bankName: z.string().max(100).optional(),
    }),
};

// ---- Restaurant ----
export const createRestaurantSchema = {
    body: z.object({
        name: z.string().min(2).max(150),
        description: z.string().optional(),
        phone: z.string().max(15).optional(),
        email: z.string().email().optional(),
        logoUrl: z.string().url().optional(),
        coverImageUrl: z.string().url().optional(),
        addressLine1: z.string().min(5).max(255),
        addressLine2: z.string().max(255).optional(),
        city: z.string().min(2).max(100),
        state: z.string().min(2).max(100),
        pincode: z.string().min(4).max(10),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        cuisineTypes: z.array(z.string()).default([]),
        avgCostForTwo: z.number().int().positive().optional(),
        avgPrepTimeMin: z.number().int().min(5).max(120).default(30),
        minOrderAmount: z.number().int().min(0).default(0),
        deliveryRadiusKm: z.number().min(1).max(50).default(10),
        isPureVeg: z.boolean().default(false),
        hasDining: z.boolean().default(false),
        openingHours: z.record(z.string(), z.object({
            open: z.string(), close: z.string(),
        })).optional(),
    }),
};

export const updateRestaurantSchema = {
    body: z.object({
        name: z.string().min(2).max(150).optional(),
        description: z.string().optional(),
        phone: z.string().max(15).optional(),
        email: z.string().email().optional(),
        logoUrl: z.string().url().optional(),
        coverImageUrl: z.string().url().optional(),
        addressLine1: z.string().min(5).max(255).optional(),
        addressLine2: z.string().max(255).optional(),
        city: z.string().min(2).max(100).optional(),
        state: z.string().min(2).max(100).optional(),
        pincode: z.string().min(4).max(10).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        cuisineTypes: z.array(z.string()).optional(),
        avgCostForTwo: z.number().int().positive().optional(),
        avgPrepTimeMin: z.number().int().min(5).max(120).optional(),
        minOrderAmount: z.number().int().min(0).optional(),
        deliveryRadiusKm: z.number().min(1).max(50).optional(),
        isPureVeg: z.boolean().optional(),
        hasDining: z.boolean().optional(),
        isOpen: z.boolean().optional(),
        openingHours: z.record(z.string(), z.object({
            open: z.string(), close: z.string(),
        })).optional(),
    }),
    params: z.object({ restaurantId: z.string().uuid() }),
};

export const restaurantIdParamSchema = {
    params: z.object({ restaurantId: z.string().uuid() }),
};

// ---- Menu Category ----
export const createCategorySchema = {
    body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        sortOrder: z.number().int().min(0).default(0),
    }),
    params: z.object({ restaurantId: z.string().uuid() }),
};

export const updateCategorySchema = {
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(255).optional(),
        sortOrder: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
    }),
    params: z.object({ restaurantId: z.string().uuid(), categoryId: z.string().uuid() }),
};

// ---- Menu Item ----
export const createMenuItemSchema = {
    body: z.object({
        name: z.string().min(1).max(150),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
        price: z.number().int().positive(),
        discountedPrice: z.number().int().positive().optional(),
        foodType: z.enum(['veg', 'non_veg', 'egg']).default('veg'),
        isBestseller: z.boolean().default(false),
        sortOrder: z.number().int().min(0).default(0),
        calories: z.number().int().positive().optional(),
        prepTimeMin: z.number().int().positive().optional(),
        customizations: z.any().optional(),
    }),
    params: z.object({ restaurantId: z.string().uuid(), categoryId: z.string().uuid() }),
};

export const updateMenuItemSchema = {
    body: z.object({
        name: z.string().min(1).max(150).optional(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
        price: z.number().int().positive().optional(),
        discountedPrice: z.number().int().positive().nullable().optional(),
        foodType: z.enum(['veg', 'non_veg', 'egg']).optional(),
        isBestseller: z.boolean().optional(),
        status: z.enum(['available', 'out_of_stock', 'hidden']).optional(),
        sortOrder: z.number().int().min(0).optional(),
        calories: z.number().int().positive().optional(),
        prepTimeMin: z.number().int().positive().optional(),
        customizations: z.any().optional(),
    }),
    params: z.object({
        restaurantId: z.string().uuid(),
        categoryId: z.string().uuid(),
        itemId: z.string().uuid(),
    }),
};
