import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as customerService from './customer.service';

// ============================================================
// Customer Controller
// ============================================================

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await customerService.updateProfile(userId, req.body);
    ApiResponse.success(res, user, 'Profile updated');
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
    const addresses = await customerService.getAddresses(req.user!.userId);
    ApiResponse.success(res, addresses, 'Addresses retrieved');
});

export const getAddress = asyncHandler(async (req: Request, res: Response) => {
    const address = await customerService.getAddress(String(req.params.addressId), req.user!.userId);
    ApiResponse.success(res, address, 'Address retrieved');
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
    const address = await customerService.createAddress(req.user!.userId, req.body);
    ApiResponse.created(res, address, 'Address created');
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
    const address = await customerService.updateAddress(String(req.params.addressId), req.user!.userId, req.body);
    ApiResponse.success(res, address, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
    await customerService.deleteAddress(String(req.params.addressId), req.user!.userId);
    ApiResponse.success(res, null, 'Address deleted');
});
