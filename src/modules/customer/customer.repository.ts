import { query } from '../../config/database';

// ============================================================
// Customer Repository
// ============================================================

export interface AddressRow {
    id: string;
    user_id: string;
    label: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
}

// Transform snake_case DB row to camelCase for API response
function transformAddressRow(row: AddressRow) {
    return {
        id: row.id,
        userId: row.user_id,
        label: row.label,
        fullName: row.full_name,
        phone: row.phone,
        addressLine1: row.address_line1,
        addressLine2: row.address_line2,
        landmark: row.landmark,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        latitude: row.latitude,
        longitude: row.longitude,
        isDefault: row.is_default,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ---- Profile ----

export async function updateProfile(userId: string, data: {
    fullName?: string;
    email?: string;
    avatarUrl?: string;
}) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.fullName !== undefined) { fields.push(`full_name = $${idx++}`); values.push(data.fullName); }
    if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
    if (data.avatarUrl !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(data.avatarUrl); }

    if (fields.length === 0) return null;

    values.push(userId);
    const result = await query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        values,
    );
    return result.rows[0] || null;
}

// ---- Addresses ----

export async function getUserAddresses(userId: string) {
    const result = await query<AddressRow>(
        `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
        [userId],
    );
    return result.rows.map(transformAddressRow);
}

export async function getAddressById(addressId: string, userId: string) {
    const result = await query<AddressRow>(
        `SELECT * FROM addresses WHERE id = $1 AND user_id = $2`,
        [addressId, userId],
    );
    return result.rows[0] ? transformAddressRow(result.rows[0]) : null;
}

export async function createAddress(userId: string, data: {
    label: string; fullName: string; phone: string;
    addressLine1: string; addressLine2?: string; landmark?: string;
    city: string; state: string; pincode: string;
    latitude?: number; longitude?: number; isDefault: boolean;
}) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
        await query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const result = await query<AddressRow>(
        `INSERT INTO addresses (user_id, label, full_name, phone, address_line1, address_line2,
         landmark, city, state, pincode, latitude, longitude, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [userId, data.label, data.fullName, data.phone, data.addressLine1,
            data.addressLine2 || null, data.landmark || null, data.city, data.state,
            data.pincode, data.latitude || null, data.longitude || null, data.isDefault],
    );
    return result.rows[0] ? transformAddressRow(result.rows[0]) : null;
}

export async function updateAddress(addressId: string, userId: string, data: Record<string, unknown>) {
    const fieldMap: Record<string, string> = {
        label: 'label', fullName: 'full_name', phone: 'phone',
        addressLine1: 'address_line1', addressLine2: 'address_line2',
        landmark: 'landmark', city: 'city', state: 'state', pincode: 'pincode',
        latitude: 'latitude', longitude: 'longitude', isDefault: 'is_default',
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, dbCol] of Object.entries(fieldMap)) {
        if (data[key] !== undefined) {
            fields.push(`${dbCol} = $${idx++}`);
            values.push(data[key]);
        }
    }

    if (fields.length === 0) return null;

    // Handle default address toggle
    if (data.isDefault === true) {
        await query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    values.push(addressId, userId);
    const result = await query<AddressRow>(
        `UPDATE addresses SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
        values,
    );
    return result.rows[0] ? transformAddressRow(result.rows[0]) : null;
}

export async function deleteAddress(addressId: string, userId: string): Promise<boolean> {
    const result = await query(
        'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
        [addressId, userId],
    );
    return (result.rowCount ?? 0) > 0;
}
