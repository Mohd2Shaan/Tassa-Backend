import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import * as adminRepo from './admin.repository';
import { AppError } from '../../utils/AppError';

// ============================================================
// Admin Controller
// ============================================================

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminRepo.getDashboardStats();
    ApiResponse.success(res, stats, 'Dashboard stats retrieved');
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string | undefined;
    const result = await adminRepo.getAllUsers(page, limit, search);
    ApiResponse.success(res, result, 'Users retrieved');
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const user = await adminRepo.updateUserStatus(String(req.params.userId), req.body.status);
    if (!user) throw AppError.notFound('User not found');
    ApiResponse.success(res, user, 'User status updated');
});

export const getPendingVendors = asyncHandler(async (_req: Request, res: Response) => {
    const vendors = await adminRepo.getPendingVendors();
    ApiResponse.success(res, vendors, 'Pending vendors retrieved');
});

export const approveVendor = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await adminRepo.approveVendor(String(req.params.vendorId), req.user!.userId);
    if (!vendor) throw AppError.notFound('Vendor not found');
    ApiResponse.success(res, vendor, 'Vendor approved');
});

export const rejectVendor = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await adminRepo.rejectVendor(String(req.params.vendorId), req.user!.userId, req.body.reason);
    if (!vendor) throw AppError.notFound('Vendor not found');
    ApiResponse.success(res, vendor, 'Vendor rejected');
});

export const getPendingDeliveryPartners = asyncHandler(async (_req: Request, res: Response) => {
    const partners = await adminRepo.getPendingDeliveryPartners();
    ApiResponse.success(res, partners, 'Pending delivery partners retrieved');
});

export const approveDeliveryPartner = asyncHandler(async (req: Request, res: Response) => {
    const partner = await adminRepo.approveDeliveryPartner(String(req.params.partnerId), req.user!.userId);
    if (!partner) throw AppError.notFound('Delivery partner not found');
    ApiResponse.success(res, partner, 'Delivery partner approved');
});

export const rejectDeliveryPartner = asyncHandler(async (req: Request, res: Response) => {
    const partner = await adminRepo.rejectDeliveryPartner(String(req.params.partnerId), req.user!.userId, req.body.reason);
    if (!partner) throw AppError.notFound('Delivery partner not found');
    ApiResponse.success(res, partner, 'Delivery partner rejected');
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;
    const result = await adminRepo.getAllOrders(page, limit, status);
    ApiResponse.success(res, result, 'Orders retrieved');
});
