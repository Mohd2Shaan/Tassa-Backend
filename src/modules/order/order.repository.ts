import { query, transaction } from '../../config/database';

// ============================================================
// Order Repository
// ============================================================

export async function findOrderByIdempotencyKey(key: string) {
    const result = await query(
        `SELECT id, order_number, customer_id, restaurant_id, status, total_amount, created_at
         FROM orders WHERE idempotency_key = $1`,
        [key],
    );
    return result.rows[0] || null;
}

export async function createOrder(data: {
    customerId: string; restaurantId: string; addressSnapshot: Record<string, unknown>;
    subtotal: number; deliveryFee: number; packagingFee: number; platformFee: number;
    taxAmount: number; discountAmount: number; totalAmount: number;
    deliveryInstructions?: string; couponCode?: string; idempotencyKey: string;
    estimatedPrepTimeMin?: number; estimatedDeliveryMin?: number;
    items: Array<{ menuItemId: string; unitPrice: number; quantity: number; totalPrice: number; customizations?: unknown; specialInstructions?: string }>;
}) {
    return transaction(async (client) => {
        // Create order header — columns match 001_initial_schema.sql exactly
        const orderResult = await client.query(
            `INSERT INTO orders (customer_id, restaurant_id, delivery_address_snapshot,
             subtotal, delivery_fee, packaging_fee, platform_fee, tax_amount, discount_amount,
             total_amount, delivery_instructions, coupon_code, idempotency_key,
             estimated_prep_time_min, estimated_delivery_min)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
            [data.customerId, data.restaurantId, JSON.stringify(data.addressSnapshot),
            data.subtotal, data.deliveryFee, data.packagingFee, data.platformFee,
            data.taxAmount, data.discountAmount, data.totalAmount,
            data.deliveryInstructions || null, data.couponCode || null, data.idempotencyKey,
            data.estimatedPrepTimeMin || null, data.estimatedDeliveryMin || null],
        );
        const order = orderResult.rows[0];

        // C3 Fix: Multi-row INSERT for order items instead of N individual inserts
        if (data.items.length > 0) {
            const valuePlaceholders: string[] = [];
            const itemValues: unknown[] = [];
            let paramIdx = 1;

            for (const item of data.items) {
                valuePlaceholders.push(
                    `($${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++})`,
                );
                itemValues.push(
                    order.id, item.menuItemId, item.quantity,
                    item.unitPrice, item.totalPrice,
                    item.customizations ? JSON.stringify(item.customizations) : null,
                );
            }

            await client.query(
                `INSERT INTO order_items (order_id, menu_item_id, quantity,
                 unit_price, total_price, customizations)
                 VALUES ${valuePlaceholders.join(', ')}`,
                itemValues,
            );
        }

        // C5 Fix: Log initial status with from_status = NULL and to_status = 'pending'
        await client.query(
            `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, change_source)
             VALUES ($1, NULL, 'pending', $2, 'customer')`,
            [order.id, data.customerId],
        );

        return order;
    });
}

export async function getOrderById(orderId: string) {
    const result = await query(
        `SELECT id, order_number, customer_id, restaurant_id, status, subtotal,
         delivery_fee, packaging_fee, platform_fee, tax_amount, discount_amount,
         total_amount, coupon_code, created_at, updated_at
         FROM orders WHERE id = $1`,
        [orderId],
    );
    return result.rows[0] || null;
}

export async function getOrderWithItems(orderId: string) {
    const order = await query(
        `SELECT id, order_number, customer_id, restaurant_id, delivery_address_snapshot,
         status, subtotal, delivery_fee, packaging_fee, platform_fee, tax_amount,
         discount_amount, total_amount, coupon_code, cooking_instructions,
         delivery_instructions, confirmed_at, vendor_accepted_at, preparing_at,
         ready_at, picked_up_at, delivered_at, cancelled_at, cancellation_reason,
         estimated_prep_time_min, estimated_delivery_min, created_at, updated_at
         FROM orders WHERE id = $1`,
        [orderId],
    );
    if (!order.rows[0]) return null;

    const items = await query(
        `SELECT oi.id, oi.menu_item_id, oi.quantity, oi.unit_price, oi.total_price,
         oi.customizations, oi.special_instructions, mi.name AS item_name, mi.image_url
         FROM order_items oi
         LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
         WHERE oi.order_id = $1`,
        [orderId],
    );

    const statusLogs = await query(
        `SELECT id, from_status, to_status, changed_by, change_source, notes, created_at
         FROM order_status_logs WHERE order_id = $1 ORDER BY created_at`,
        [orderId],
    );

    return { ...order.rows[0], items: items.rows, statusLogs: statusLogs.rows };
}

// C5 Fix: Track from_status properly in status transitions
export async function updateOrderStatus(
    orderId: string, newStatus: string, currentStatus: string,
    changedBy: string, changeSource: string, reason?: string,
) {
    return transaction(async (client) => {
        // Update timestamps based on status
        const timestampField = getTimestampField(newStatus);
        const timestampClause = timestampField ? `, ${timestampField} = NOW()` : '';

        const result = await client.query(
            `UPDATE orders SET status = $1${timestampClause}, updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [newStatus, orderId],
        );

        // Log with both from_status and to_status
        await client.query(
            `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, change_source, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderId, currentStatus, newStatus, changedBy, changeSource, reason || null],
        );

        return result.rows[0];
    });
}

/** Map order status to its timestamp column for automatic tracking. */
function getTimestampField(status: string): string | null {
    const map: Record<string, string> = {
        confirmed: 'confirmed_at',
        vendor_accepted: 'vendor_accepted_at',
        preparing: 'preparing_at',
        ready_for_pickup: 'ready_at',
        picked_up: 'picked_up_at',
        delivered: 'delivered_at',
        cancelled_by_customer: 'cancelled_at',
        cancelled_by_vendor: 'cancelled_at',
        cancelled_by_admin: 'cancelled_at',
    };
    return map[status] || null;
}

export async function getCustomerOrders(customerId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const count = await query('SELECT COUNT(*) FROM orders WHERE customer_id = $1', [customerId]);
    const result = await query(
        `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
         r.name AS restaurant_name, r.logo_url AS restaurant_logo
         FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
         WHERE o.customer_id = $1 ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`,
        [customerId, limit, offset],
    );
    return { orders: result.rows, total: parseInt(count.rows[0].count) };
}

export async function getRestaurantOrders(restaurantId: string, status: string | null, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const statusFilter = status ? `AND o.status = $2` : '';
    const params: unknown[] = [restaurantId];
    if (status) params.push(status);

    const countResult = await query(
        `SELECT COUNT(*) FROM orders o WHERE o.restaurant_id = $1 ${statusFilter}`, params,
    );
    params.push(limit, offset);
    const result = await query(
        `SELECT o.id, o.order_number, o.customer_id, o.status, o.subtotal, o.total_amount,
         o.created_at, o.updated_at
         FROM orders o WHERE o.restaurant_id = $1 ${statusFilter}
         ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
    );
    return { orders: result.rows, total: parseInt(countResult.rows[0].count) };
}
