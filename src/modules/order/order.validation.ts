import { z } from 'zod';

// ============================================================
// Order Validation Schemas
// ============================================================

export const createOrderSchema = {
    body: z.object({
        restaurantId: z.string().uuid(),
        addressId: z.string().uuid(),
        items: z.array(z.object({
            menuItemId: z.string().uuid(),
            quantity: z.number().int().positive(),
            customizations: z.any().optional(),
            specialInstructions: z.string().max(500).optional(),
        })).min(1, 'Order must contain at least one item'),
        deliveryInstructions: z.string().max(500).optional(),
        couponCode: z.string().optional(),
        idempotencyKey: z.string().uuid(),
    }),
};

export const updateOrderStatusSchema = {
    params: z.object({ orderId: z.string().uuid() }),
    body: z.object({
        status: z.enum([
            'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery',
            'delivered', 'cancelled', 'refunded',
        ]),
        reason: z.string().optional(),
    }),
};

export const orderIdParamSchema = {
    params: z.object({ orderId: z.string().uuid() }),
};
