import { z } from 'zod';

// ============================================================
// Customer Validation Schemas
// ============================================================

export const updateProfileSchema = {
    body: z.object({
        fullName: z.string().min(2).max(100).optional(),
        email: z.string().email().optional(),
        avatarUrl: z.string().url().optional(),
    }),
};

export const createAddressSchema = {
    body: z.object({
        label: z.enum(['home', 'work', 'other']).default('home'),
        fullName: z.string().min(2).max(100),
        phone: z.string().min(10).max(15),
        addressLine1: z.string().min(5).max(255),
        addressLine2: z.string().max(255).nullish(),
        landmark: z.string().max(255).nullish(),
        city: z.string().min(2).max(100),
        state: z.string().min(2).max(100),
        pincode: z.string().min(4).max(10),
        latitude: z.number().min(-90).max(90).nullish(),
        longitude: z.number().min(-180).max(180).nullish(),
        isDefault: z.boolean().default(false),
    }),
};

export const updateAddressSchema = {
    body: z.object({
        label: z.enum(['home', 'work', 'other']).optional(),
        fullName: z.string().min(2).max(100).optional(),
        phone: z.string().min(10).max(15).optional(),
        addressLine1: z.string().min(5).max(255).optional(),
        addressLine2: z.string().max(255).nullish(),
        landmark: z.string().max(255).nullish(),
        city: z.string().min(2).max(100).optional(),
        state: z.string().min(2).max(100).optional(),
        pincode: z.string().min(4).max(10).optional(),
        latitude: z.number().min(-90).max(90).nullish(),
        longitude: z.number().min(-180).max(180).nullish(),
        isDefault: z.boolean().optional(),
    }),
    params: z.object({
        addressId: z.string().uuid(),
    }),
};

export const addressIdParamSchema = {
    params: z.object({
        addressId: z.string().uuid(),
    }),
};
