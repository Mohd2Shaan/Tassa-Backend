import * as deliveryRepo from './delivery.repository';
import { AppError } from '../../utils/AppError';
import { ROLES, DELIVERY_STATUS } from '../../utils/constants';
import { assignRole } from '../auth/auth.repository';

// ============================================================
// Delivery Service
// ============================================================

export async function registerAsDeliveryPartner(userId: string, data: Record<string, unknown>) {
    const existing = await deliveryRepo.getDeliveryPartnerProfile(userId);
    if (existing) throw AppError.conflict('You are already registered as a delivery partner');
    await assignRole(userId, ROLES.DELIVERY_PARTNER);
    return deliveryRepo.createDeliveryPartnerProfile(userId, data);
}

export async function getProfile(userId: string) {
    const profile = await deliveryRepo.getDeliveryPartnerProfile(userId);
    if (!profile) throw AppError.notFound('Delivery partner profile not found');
    return profile;
}

export async function updateLocation(userId: string, lat: number, lng: number) {
    const result = await deliveryRepo.updateLocation(userId, lat, lng);
    if (!result) throw AppError.notFound('Delivery partner profile not found');
    return result;
}

export async function toggleAvailability(userId: string, isAvailable: boolean) {
    const result = await deliveryRepo.toggleAvailability(userId, isAvailable);
    if (!result) throw AppError.notFound('Delivery partner profile not found');
    return result;
}

export async function getActiveDeliveries(userId: string) {
    const profile = await deliveryRepo.getDeliveryPartnerProfile(userId);
    if (!profile) throw AppError.notFound('Profile not found');
    return deliveryRepo.getActiveDeliveries(profile.id);
}

export async function updateDeliveryStatus(
    userId: string, deliveryId: string, action: string, extra: Record<string, unknown> = {},
) {
    const profile = await deliveryRepo.getDeliveryPartnerProfile(userId);
    if (!profile) throw AppError.notFound('Profile not found');

    const delivery = await deliveryRepo.getDeliveryById(deliveryId);
    if (!delivery) throw AppError.notFound('Delivery not found');
    if (delivery.partner_id !== profile.id) throw AppError.forbidden('This delivery is not assigned to you');

    const statusMap: Record<string, string> = {
        accept: DELIVERY_STATUS.ACCEPTED,
        reject: DELIVERY_STATUS.REJECTED,
        picked_up: DELIVERY_STATUS.PICKED_UP,
        in_transit: DELIVERY_STATUS.IN_TRANSIT,
        delivered: DELIVERY_STATUS.DELIVERED,
        failed: DELIVERY_STATUS.FAILED,
    };

    const newStatus = statusMap[action];
    if (!newStatus) throw AppError.badRequest('Invalid action');

    // For delivery, verify OTP
    if (action === 'delivered') {
        if (!extra.otp) throw AppError.badRequest('Delivery OTP is required');
        if (delivery.delivery_otp !== extra.otp) throw AppError.badRequest('Invalid delivery OTP');
        extra.otpVerified = true;
        extra.otpVerifiedAt = new Date();
        extra.deliveredAt = new Date();
    }

    if (action === 'accept') extra.acceptedAt = new Date();
    if (action === 'picked_up') extra.pickedUpAt = new Date();

    return deliveryRepo.updateDeliveryStatus(deliveryId, newStatus, extra);
}

export async function getDeliveryHistory(userId: string, page: number, limit: number) {
    const profile = await deliveryRepo.getDeliveryPartnerProfile(userId);
    if (!profile) throw AppError.notFound('Profile not found');
    return deliveryRepo.getDeliveryHistory(profile.id, page, limit);
}
