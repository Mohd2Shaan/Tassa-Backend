import { query } from '../../config/database';

// ============================================================
// Delivery Repository
// ============================================================

export async function getDeliveryPartnerProfile(userId: string) {
    const result = await query('SELECT * FROM delivery_partner_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
}

export async function createDeliveryPartnerProfile(userId: string, data: Record<string, unknown>) {
    const result = await query(
        `INSERT INTO delivery_partner_profiles (user_id, vehicle_type, vehicle_number,
         driving_license_no, driving_license_url, aadhaar_number, aadhaar_url, pan_number,
         bank_account_no, bank_ifsc, bank_name, date_of_birth, gender)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [userId, data.vehicleType, data.vehicleNumber || null,
            data.drivingLicenseNo || null, data.drivingLicenseUrl || null,
            data.aadhaarNumber || null, data.aadhaarUrl || null, data.panNumber || null,
            data.bankAccountNo || null, data.bankIfsc || null, data.bankName || null,
            data.dateOfBirth || null, data.gender || null],
    );
    return result.rows[0];
}

export async function updateLocation(userId: string, lat: number, lng: number) {
    const result = await query(
        `UPDATE delivery_partner_profiles SET current_latitude = $1, current_longitude = $2,
         last_location_at = NOW(), updated_at = NOW() WHERE user_id = $3 RETURNING *`,
        [lat, lng, userId],
    );
    return result.rows[0] || null;
}

export async function toggleAvailability(userId: string, isAvailable: boolean) {
    const result = await query(
        `UPDATE delivery_partner_profiles SET is_available = $1, updated_at = NOW()
         WHERE user_id = $2 RETURNING *`,
        [isAvailable, userId],
    );
    return result.rows[0] || null;
}

export async function getActiveDeliveries(partnerId: string) {
    const result = await query(
        `SELECT d.*, o.order_number, o.restaurant_id, o.delivery_address_snapshot
         FROM deliveries d JOIN orders o ON o.id = d.order_id
         WHERE d.partner_id = $1 AND d.status NOT IN ('delivered', 'failed', 'cancelled')
         ORDER BY d.created_at DESC`,
        [partnerId],
    );
    return result.rows;
}

export async function getDeliveryById(deliveryId: string) {
    const result = await query(
        `SELECT d.*, o.order_number, o.restaurant_id, o.delivery_address_snapshot
         FROM deliveries d JOIN orders o ON o.id = d.order_id
         WHERE d.id = $1`,
        [deliveryId],
    );
    return result.rows[0] || null;
}

export async function updateDeliveryStatus(deliveryId: string, status: string, extra: Record<string, unknown> = {}) {
    const fields = [`status = $1`];
    const values: unknown[] = [status];
    let idx = 2;

    const extras: Record<string, string> = {
        acceptedAt: 'accepted_at', pickedUpAt: 'picked_up_at', deliveredAt: 'delivered_at',
        rejectionReason: 'rejection_reason', failureReason: 'failure_reason',
        failureImageUrl: 'failure_image_url', otpVerified: 'otp_verified', otpVerifiedAt: 'otp_verified_at',
    };
    for (const [k, col] of Object.entries(extras)) {
        if (extra[k] !== undefined) { fields.push(`${col} = $${idx++}`); values.push(extra[k]); }
    }

    values.push(deliveryId);
    const result = await query(
        `UPDATE deliveries SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        values,
    );
    return result.rows[0] || null;
}

export async function getDeliveryHistory(partnerId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const count = await query(
        `SELECT COUNT(*) FROM deliveries WHERE partner_id = $1 AND status IN ('delivered', 'failed')`,
        [partnerId],
    );
    const result = await query(
        `SELECT d.*, o.order_number FROM deliveries d JOIN orders o ON o.id = d.order_id
         WHERE d.partner_id = $1 AND d.status IN ('delivered', 'failed')
         ORDER BY d.created_at DESC LIMIT $2 OFFSET $3`,
        [partnerId, limit, offset],
    );
    return { deliveries: result.rows, total: parseInt(count.rows[0].count) };
}

export async function findAvailablePartner(lat: number, lng: number, radiusKm: number = 5) {
    const result = await query(
        `SELECT * FROM delivery_partner_profiles
         WHERE is_available = TRUE AND approval_status = 'approved'
         AND current_latitude IS NOT NULL AND current_longitude IS NOT NULL
         AND ABS(current_latitude - $1) < $3 / 111.0
         AND ABS(current_longitude - $2) < $3 / (111.0 * COS(RADIANS($1)))
         ORDER BY (POW(current_latitude - $1, 2) + POW(current_longitude - $2, 2))
         LIMIT 1`,
        [lat, lng, radiusKm],
    );
    return result.rows[0] || null;
}
