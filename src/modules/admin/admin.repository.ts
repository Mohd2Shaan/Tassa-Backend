import { query } from '../../config/database';

// ============================================================
// Admin Repository — Dashboard queries
// ============================================================

export async function getDashboardStats() {
    const [users, orders, revenue, pending] = await Promise.all([
        query(`SELECT COUNT(*) AS total_users, 
               COUNT(*) FILTER (WHERE status = 'active') AS active_users,
               COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS new_users_30d
               FROM users`),
        query(`SELECT COUNT(*) AS total_orders, 
               COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders,
               COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS orders_30d
               FROM orders`),
        query(`SELECT COALESCE(SUM(total_amount), 0) AS total_revenue,
               COALESCE(SUM(total_amount) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) AS revenue_30d,
               COALESCE(SUM(platform_fee), 0) AS total_platform_fees
               FROM orders WHERE status = 'delivered'`),
        query(`SELECT 
               (SELECT COUNT(*) FROM vendor_profiles WHERE approval_status = 'pending') AS pending_vendors,
               (SELECT COUNT(*) FROM delivery_partner_profiles WHERE approval_status = 'pending') AS pending_delivery_partners`),
    ]);

    return {
        users: users.rows[0],
        orders: orders.rows[0],
        revenue: revenue.rows[0],
        pendingApprovals: pending.rows[0],
    };
}

export async function getAllUsers(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit;
    const whereClause = search ? `WHERE u.full_name ILIKE $3 OR u.phone LIKE $3` : '';
    const params: unknown[] = [limit, offset];
    if (search) params.push(`%${search}%`);

    const count = await query(`SELECT COUNT(*) FROM users u ${whereClause}`, search ? [`%${search}%`] : []);
    const result = await query(
        `SELECT u.*, ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
         LEFT JOIN roles r ON r.id = ur.role_id
         ${whereClause}
         GROUP BY u.id ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
        params,
    );
    return { users: result.rows, total: parseInt(count.rows[0].count) };
}

export async function updateUserStatus(userId: string, status: string) {
    const result = await query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, userId],
    );
    return result.rows[0] || null;
}

export async function getPendingVendors() {
    const result = await query(
        `SELECT vp.*, u.full_name, u.phone FROM vendor_profiles vp
         JOIN users u ON u.id = vp.user_id WHERE vp.approval_status = 'pending'
         ORDER BY vp.created_at`
    );
    return result.rows;
}

export async function approveVendor(vendorProfileId: string, adminId: string) {
    const result = await query(
        `UPDATE vendor_profiles SET approval_status = 'approved', approved_by = $1,
         approved_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`,
        [adminId, vendorProfileId],
    );
    return result.rows[0] || null;
}

export async function rejectVendor(vendorProfileId: string, adminId: string, reason: string) {
    const result = await query(
        `UPDATE vendor_profiles SET approval_status = 'rejected', rejection_reason = $1,
         approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *`,
        [reason, adminId, vendorProfileId],
    );
    return result.rows[0] || null;
}

export async function getPendingDeliveryPartners() {
    const result = await query(
        `SELECT dp.*, u.full_name, u.phone FROM delivery_partner_profiles dp
         JOIN users u ON u.id = dp.user_id WHERE dp.approval_status = 'pending'
         ORDER BY dp.created_at`
    );
    return result.rows;
}

export async function approveDeliveryPartner(partnerId: string, adminId: string) {
    const result = await query(
        `UPDATE delivery_partner_profiles SET approval_status = 'approved', approved_by = $1,
         approved_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`,
        [adminId, partnerId],
    );
    return result.rows[0] || null;
}

export async function rejectDeliveryPartner(partnerId: string, adminId: string, reason: string) {
    const result = await query(
        `UPDATE delivery_partner_profiles SET approval_status = 'rejected', rejection_reason = $1,
         approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *`,
        [reason, adminId, partnerId],
    );
    return result.rows[0] || null;
}

export async function getAllOrders(page: number, limit: number, status?: string) {
    const offset = (page - 1) * limit;
    const whereClause = status ? 'WHERE o.status = $3' : '';
    const params: unknown[] = [limit, offset];
    if (status) params.push(status);

    const count = await query(`SELECT COUNT(*) FROM orders o ${whereClause}`, status ? [status] : []);
    const result = await query(
        `SELECT o.*, r.name AS restaurant_name, u.full_name AS customer_name
         FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
         JOIN users u ON u.id = o.customer_id
         ${whereClause} ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
        params,
    );
    return { orders: result.rows, total: parseInt(count.rows[0].count) };
}
