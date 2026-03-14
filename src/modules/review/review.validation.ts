import { z } from 'zod';

export const createReviewSchema = {
    body: z.preprocess(
        (data: unknown) => {
            const d = data as Record<string, unknown>;
            // Accept Flutter-friendly aliases
            if (d.rating !== undefined && d.foodRating === undefined) {
                d.foodRating = d.rating;
                delete d.rating;
            }
            if (d.comment !== undefined && d.reviewText === undefined) {
                d.reviewText = d.comment;
                delete d.comment;
            }
            return d;
        },
        z.object({
            orderId: z.string().uuid(),
            foodRating: z.number().int().min(1).max(5),
            deliveryRating: z.number().int().min(1).max(5).optional(),
            overallRating: z.number().int().min(1).max(5).optional(),
            reviewText: z.string().max(1000).optional(),
            restaurantId: z.string().uuid().optional(),
        }),
    ),
};

export const vendorReplySchema = {
    params: z.object({ reviewId: z.string().uuid() }),
    body: z.object({ reply: z.string().max(500) }),
};
