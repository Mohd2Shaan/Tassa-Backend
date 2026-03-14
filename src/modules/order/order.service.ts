import * as orderRepo from './order.repository';
import * as customerRepo from '../customer/customer.repository';
import * as vendorRepo from '../vendor/vendor.repository';
import { AppError } from '../../utils/AppError';
import { ORDER_TRANSITIONS } from '../../utils/constants';

// ============================================================
// Order Service
// ============================================================

export async function createOrder(customerId: string, data: Record<string, unknown>) {
    // Idempotency check
    const existingOrder = await orderRepo.findOrderByIdempotencyKey(data.idempotencyKey as string);
    if (existingOrder) return existingOrder;

    // Validate restaurant
    const restaurant = await vendorRepo.getRestaurantById(data.restaurantId as string);
    if (!restaurant) throw AppError.notFound('Restaurant not found');
    if (restaurant.status !== 'active') throw AppError.badRequest('Restaurant is not accepting orders');
    if (!restaurant.is_open) throw AppError.badRequest('Restaurant is currently closed');

    // Validate address
    const address = await customerRepo.getAddressById(data.addressId as string, customerId);
    if (!address) throw AppError.notFound('Delivery address not found');

    // Validate & calculate items
    const items = data.items as Array<{
        menuItemId: string; quantity: number; customizations?: unknown; specialInstructions?: string;
    }>;

    if (!items || items.length === 0) {
        throw AppError.badRequest('Order must contain at least one item');
    }

    // C2 Fix: Batch-fetch ALL menu items in a single query (eliminates N+1)
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await vendorRepo.getMenuItemsByIds(menuItemIds);

    // Build a lookup map for O(1) access per item
    const menuItemMap = new Map<string, typeof menuItems[0]>();
    for (const mi of menuItems) {
        menuItemMap.set(mi.id, mi);
    }

    // Validate each item using the pre-fetched map (no DB calls in loop)
    const orderItems: Array<{
        menuItemId: string; unitPrice: number; quantity: number;
        totalPrice: number; customizations?: unknown; specialInstructions?: string;
    }> = [];
    let subtotal = 0;

    for (const item of items) {
        const menuItem = menuItemMap.get(item.menuItemId);
        if (!menuItem) throw AppError.badRequest(`Menu item ${item.menuItemId} not found`);
        if (menuItem.restaurant_id !== data.restaurantId) {
            throw AppError.badRequest(`Menu item ${menuItem.name} does not belong to this restaurant`);
        }
        if (menuItem.status !== 'available') {
            throw AppError.badRequest(`${menuItem.name} is currently unavailable`);
        }

        const unitPrice = menuItem.discounted_price || menuItem.price;
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
            menuItemId: item.menuItemId,
            unitPrice,
            quantity: item.quantity,
            totalPrice,
            customizations: item.customizations,
            specialInstructions: item.specialInstructions,
        });
    }

    // Check minimum order amount
    if (restaurant.min_order_amount && subtotal < restaurant.min_order_amount) {
        throw AppError.badRequest(
            `Minimum order amount is ₹${(restaurant.min_order_amount / 100).toFixed(2)}`,
        );
    }

    // Calculate fees — all amounts in paisa (C6: consistent unit)
    const deliveryFee = 3000;      // ₹30 flat fee
    const packagingFee = 1000;     // ₹10 packaging
    const platformFee = Math.round(subtotal * 0.05);    // 5% platform fee
    const taxAmount = Math.round((subtotal + platformFee) * 0.05); // 5% GST
    const discountAmount = 0;      // TODO: coupon processing
    const totalAmount = subtotal + deliveryFee + packagingFee + platformFee + taxAmount - discountAmount;

    const addressSnapshot = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        latitude: address.latitude,
        longitude: address.longitude,
    };

    return orderRepo.createOrder({
        customerId,
        restaurantId: data.restaurantId as string,
        addressSnapshot,
        subtotal,
        deliveryFee,
        packagingFee,
        platformFee,
        taxAmount,
        discountAmount,
        totalAmount,
        deliveryInstructions: data.deliveryInstructions as string | undefined,
        couponCode: data.couponCode as string | undefined,
        idempotencyKey: data.idempotencyKey as string,
        estimatedPrepTimeMin: restaurant.avg_prep_time_min,
        items: orderItems,
    });
}

export async function getOrder(orderId: string, userId: string) {
    const order = await orderRepo.getOrderWithItems(orderId) as Record<string, unknown> | null;
    if (!order) throw AppError.notFound('Order not found');
    // Verify the user is the customer or vendor
    if (order.customer_id !== userId) {
        // Check if they're the vendor for the restaurant
        const vProfile = await vendorRepo.getVendorProfile(userId);
        if (!vProfile) throw AppError.forbidden('Access denied');
    }
    return order;
}

// C5 Fix: Pass currentStatus from the fetched order to repository for from_status tracking
export async function updateOrderStatus(
    orderId: string, status: string, changedBy: string,
    changeSource = 'system', reason?: string,
) {
    const order = await orderRepo.getOrderById(orderId);
    if (!order) throw AppError.notFound('Order not found');

    // Validate transition using state machine
    const allowedTransitions = ORDER_TRANSITIONS[order.status as keyof typeof ORDER_TRANSITIONS];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
        throw AppError.badRequest(
            `Cannot transition from '${order.status}' to '${status}'. Allowed: ${allowedTransitions?.join(', ') || 'none'}`,
        );
    }

    return orderRepo.updateOrderStatus(orderId, status, order.status, changedBy, changeSource, reason);
}

export async function getMyOrders(customerId: string, page: number, limit: number) {
    return orderRepo.getCustomerOrders(customerId, page, limit);
}

export async function getRestaurantOrders(userId: string, restaurantId: string, status: string | null, page: number, limit: number) {
    // Verify vendor ownership
    const vProfile = await vendorRepo.getVendorProfile(userId);
    if (!vProfile) throw AppError.forbidden('Vendor profile required');
    const restaurant = await vendorRepo.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.vendor_id !== vProfile.id) {
        throw AppError.forbidden('Not your restaurant');
    }
    return orderRepo.getRestaurantOrders(restaurantId, status, page, limit);
}
