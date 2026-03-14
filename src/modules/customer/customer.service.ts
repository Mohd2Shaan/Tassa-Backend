import * as customerRepo from './customer.repository';
import { AppError } from '../../utils/AppError';

// ============================================================
// Customer Service
// ============================================================

export async function updateProfile(userId: string, data: {
    fullName?: string; email?: string; avatarUrl?: string;
}) {
    const updated = await customerRepo.updateProfile(userId, data);
    if (!updated) throw AppError.badRequest('No fields to update');
    return updated;
}

export async function getAddresses(userId: string) {
    return customerRepo.getUserAddresses(userId);
}

export async function getAddress(addressId: string, userId: string) {
    const address = await customerRepo.getAddressById(addressId, userId);
    if (!address) throw AppError.notFound('Address not found');
    return address;
}

export async function createAddress(userId: string, data: {
    label: string; fullName: string; phone: string;
    addressLine1: string; addressLine2?: string; landmark?: string;
    city: string; state: string; pincode: string;
    latitude?: number; longitude?: number; isDefault: boolean;
}) {
    return customerRepo.createAddress(userId, data);
}

export async function updateAddress(addressId: string, userId: string, data: Record<string, unknown>) {
    const updated = await customerRepo.updateAddress(addressId, userId, data);
    if (!updated) throw AppError.notFound('Address not found or no fields to update');
    return updated;
}

export async function deleteAddress(addressId: string, userId: string) {
    const deleted = await customerRepo.deleteAddress(addressId, userId);
    if (!deleted) throw AppError.notFound('Address not found');
}
