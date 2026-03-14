import { z } from 'zod';

// ============================================================
// Delivery Validation Schemas
// ============================================================

export const registerDeliveryPartnerSchema = {
    body: z.object({
        vehicleType: z.enum(['bike', 'scooter', 'bicycle']),
        vehicleNumber: z.string().max(20).optional(),
        drivingLicenseNo: z.string().max(30).optional(),
        drivingLicenseUrl: z.string().url().optional(),
        aadhaarNumber: z.string().max(14).optional(),
        aadhaarUrl: z.string().url().optional(),
        panNumber: z.string().max(12).optional(),
        bankAccountNo: z.string().max(20).optional(),
        bankIfsc: z.string().max(15).optional(),
        bankName: z.string().max(100).optional(),
        dateOfBirth: z.string().optional(),
        gender: z.string().max(10).optional(),
    }),
};

export const updateLocationSchema = {
    body: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }),
};

export const toggleAvailabilitySchema = {
    body: z.object({ isAvailable: z.boolean() }),
};

export const deliveryActionSchema = {
    params: z.object({ deliveryId: z.string().uuid() }),
    body: z.object({
        action: z.enum(['accept', 'reject', 'picked_up', 'in_transit', 'delivered', 'failed']),
        otp: z.string().length(6).optional(),
        rejectionReason: z.string().optional(),
        failureReason: z.string().optional(),
        failureImageUrl: z.string().url().optional(),
    }),
};
