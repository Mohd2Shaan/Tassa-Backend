import { z } from 'zod';

export const createCouponSchema = {
    body: z.object({
        code: z.string().min(3).max(20).transform(v => v.toUpperCase()),
        description: z.string().max(255).optional(),
        discountType: z.enum(['percentage', 'flat']),
        discountValue: z.number().int().positive(),
        maxDiscountAmount: z.number().int().positive().optional(),
        minOrderAmount: z.number().int().min(0).default(0),
        maxUses: z.number().int().positive().optional(),
        maxUsesPerUser: z.number().int().positive().default(1),
        validFrom: z.string().datetime(),
        validUntil: z.string().datetime(),
        restaurantId: z.string().uuid().optional(), // null = platform-wide
    }),
};

export const validateCouponSchema = {
    body: z.object({
        code: z.string().min(1),
        restaurantId: z.string().uuid(),
        orderAmount: z.number().int().positive(),
    }),
};
