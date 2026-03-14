// ============================================================
// Application Constants
// ============================================================

/**
 * User roles in the system.
 */
export const ROLES = {
    CUSTOMER: 'CUSTOMER',
    VENDOR: 'VENDOR',
    DELIVERY_PARTNER: 'DELIVERY_PARTNER',
    ADMIN: 'ADMIN',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/**
 * Order statuses — matches the database enum.
 */
export const ORDER_STATUS = {
    PENDING: 'pending',
    PAYMENT_FAILED: 'payment_failed',
    CONFIRMED: 'confirmed',
    VENDOR_ACCEPTED: 'vendor_accepted',
    VENDOR_REJECTED: 'vendor_rejected',
    PREPARING: 'preparing',
    READY_FOR_PICKUP: 'ready_for_pickup',
    DELIVERY_ASSIGNED: 'delivery_assigned',
    PICKED_UP: 'picked_up',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED_BY_CUSTOMER: 'cancelled_by_customer',
    CANCELLED_BY_VENDOR: 'cancelled_by_vendor',
    CANCELLED_BY_ADMIN: 'cancelled_by_admin',
    REFUND_INITIATED: 'refund_initiated',
    REFUND_COMPLETED: 'refund_completed',
} as const;

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * Payment statuses — matches the database enum.
 */
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    FAILED: 'failed',
    REFUND_INITIATED: 'refund_initiated',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded',
} as const;

/**
 * Delivery statuses — matches the database enum.
 */
export const DELIVERY_STATUS = {
    PENDING_ASSIGNMENT: 'pending_assignment',
    ASSIGNED: 'assigned',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
} as const;

/**
 * Approval statuses for vendors and delivery partners.
 */
export const APPROVAL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

/**
 * OTP configuration.
 */
export const OTP_CONFIG = {
    MAX_PER_PHONE_PER_HOUR: 5,
    EXPIRY_MINUTES: 10,
    MAX_VERIFY_ATTEMPTS: 3,
    RESEND_COOLDOWN_SECONDS: 30,
} as const;

/**
 * Valid order state transitions.
 * Maps current status → array of allowed next statuses.
 */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
    [ORDER_STATUS.PENDING]: [
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.PAYMENT_FAILED,
        ORDER_STATUS.CANCELLED_BY_CUSTOMER,
    ],
    [ORDER_STATUS.PAYMENT_FAILED]: [
        ORDER_STATUS.CONFIRMED, // Retry payment
        ORDER_STATUS.CANCELLED_BY_CUSTOMER,
    ],
    [ORDER_STATUS.CONFIRMED]: [
        ORDER_STATUS.VENDOR_ACCEPTED,
        ORDER_STATUS.VENDOR_REJECTED,
        ORDER_STATUS.CANCELLED_BY_CUSTOMER,
        ORDER_STATUS.CANCELLED_BY_ADMIN,
    ],
    [ORDER_STATUS.VENDOR_ACCEPTED]: [
        ORDER_STATUS.PREPARING,
        ORDER_STATUS.CANCELLED_BY_VENDOR,
        ORDER_STATUS.CANCELLED_BY_ADMIN,
    ],
    [ORDER_STATUS.VENDOR_REJECTED]: [
        ORDER_STATUS.REFUND_INITIATED,
    ],
    [ORDER_STATUS.PREPARING]: [
        ORDER_STATUS.READY_FOR_PICKUP,
        ORDER_STATUS.CANCELLED_BY_ADMIN,
    ],
    [ORDER_STATUS.READY_FOR_PICKUP]: [
        ORDER_STATUS.DELIVERY_ASSIGNED,
        ORDER_STATUS.CANCELLED_BY_ADMIN,
    ],
    [ORDER_STATUS.DELIVERY_ASSIGNED]: [
        ORDER_STATUS.PICKED_UP,
        ORDER_STATUS.CANCELLED_BY_ADMIN,
    ],
    [ORDER_STATUS.PICKED_UP]: [
        ORDER_STATUS.OUT_FOR_DELIVERY,
    ],
    [ORDER_STATUS.OUT_FOR_DELIVERY]: [
        ORDER_STATUS.DELIVERED,
    ],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED_BY_CUSTOMER]: [ORDER_STATUS.REFUND_INITIATED],
    [ORDER_STATUS.CANCELLED_BY_VENDOR]: [ORDER_STATUS.REFUND_INITIATED],
    [ORDER_STATUS.CANCELLED_BY_ADMIN]: [ORDER_STATUS.REFUND_INITIATED],
    [ORDER_STATUS.REFUND_INITIATED]: [ORDER_STATUS.REFUND_COMPLETED],
    [ORDER_STATUS.REFUND_COMPLETED]: [],
};
