import { query } from '../../config/database';

// ============================================================
// Vendor Repository
// ============================================================

// ---- Vendor Profile ----

export async function getVendorProfile(userId: string) {
    const result = await query('SELECT * FROM vendor_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
}

export async function createVendorProfile(userId: string, data: Record<string, unknown>) {
    const result = await query(
        `INSERT INTO vendor_profiles (user_id, business_name, fssai_license, gst_number, pan_number,
         bank_account_no, bank_ifsc, bank_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, data.businessName, data.fssaiLicense || null, data.gstNumber || null,
            data.panNumber || null, data.bankAccountNo || null, data.bankIfsc || null, data.bankName || null],
    );
    return result.rows[0];
}

export async function updateVendorProfile(userId: string, data: Record<string, unknown>) {
    const fieldMap: Record<string, string> = {
        businessName: 'business_name', fssaiLicense: 'fssai_license', gstNumber: 'gst_number',
        panNumber: 'pan_number', bankAccountNo: 'bank_account_no', bankIfsc: 'bank_ifsc', bankName: 'bank_name',
    };
    const fields: string[] = []; const values: unknown[] = []; let idx = 1;
    for (const [k, col] of Object.entries(fieldMap)) {
        if (data[k] !== undefined) { fields.push(`${col} = $${idx++}`); values.push(data[k]); }
    }
    if (fields.length === 0) return null;
    values.push(userId);
    const result = await query(
        `UPDATE vendor_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $${idx} RETURNING *`,
        values,
    );
    return result.rows[0] || null;
}

// ---- Restaurant ----

export async function getVendorRestaurants(vendorProfileId: string) {
    const result = await query('SELECT * FROM restaurants WHERE vendor_id = $1 ORDER BY created_at DESC', [vendorProfileId]);
    return result.rows;
}

export async function getRestaurantById(restaurantId: string) {
    const result = await query('SELECT * FROM restaurants WHERE id = $1', [restaurantId]);
    return result.rows[0] || null;
}

export async function createRestaurant(vendorId: string, data: Record<string, unknown>) {
    const result = await query(
        `INSERT INTO restaurants (vendor_id, name, description, phone, email, logo_url, cover_image_url,
         address_line1, address_line2, city, state, pincode, latitude, longitude,
         cuisine_types, avg_cost_for_two, avg_prep_time_min, min_order_amount,
         delivery_radius_km, is_pure_veg, has_dining, opening_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
        [vendorId, data.name, data.description || null, data.phone || null, data.email || null,
            data.logoUrl || null, data.coverImageUrl || null,
            data.addressLine1, data.addressLine2 || null, data.city, data.state, data.pincode,
            data.latitude, data.longitude,
            data.cuisineTypes || '{}', data.avgCostForTwo || null, data.avgPrepTimeMin || 30,
            data.minOrderAmount || 0, data.deliveryRadiusKm || 10,
            data.isPureVeg || false, data.hasDining || false,
            data.openingHours ? JSON.stringify(data.openingHours) : null],
    );
    return result.rows[0];
}

export async function updateRestaurant(restaurantId: string, data: Record<string, unknown>) {
    const fieldMap: Record<string, string> = {
        name: 'name', description: 'description', phone: 'phone', email: 'email',
        logoUrl: 'logo_url', coverImageUrl: 'cover_image_url',
        addressLine1: 'address_line1', addressLine2: 'address_line2',
        city: 'city', state: 'state', pincode: 'pincode',
        latitude: 'latitude', longitude: 'longitude',
        cuisineTypes: 'cuisine_types', avgCostForTwo: 'avg_cost_for_two',
        avgPrepTimeMin: 'avg_prep_time_min', minOrderAmount: 'min_order_amount',
        deliveryRadiusKm: 'delivery_radius_km', isPureVeg: 'is_pure_veg',
        hasDining: 'has_dining', isOpen: 'is_open', openingHours: 'opening_hours',
    };
    const fields: string[] = []; const values: unknown[] = []; let idx = 1;
    for (const [k, col] of Object.entries(fieldMap)) {
        if (data[k] !== undefined) {
            fields.push(`${col} = $${idx++}`);
            values.push(k === 'openingHours' ? JSON.stringify(data[k]) : data[k]);
        }
    }
    if (fields.length === 0) return null;
    values.push(restaurantId);
    const result = await query(
        `UPDATE restaurants SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        values,
    );
    return result.rows[0] || null;
}

// ---- Menu Categories ----

export async function getCategories(restaurantId: string) {
    const result = await query(
        'SELECT * FROM menu_categories WHERE restaurant_id = $1 ORDER BY sort_order, name',
        [restaurantId],
    );
    return result.rows;
}

export async function createCategory(restaurantId: string, data: Record<string, unknown>) {
    const result = await query(
        `INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [restaurantId, data.name, data.description || null, data.sortOrder || 0],
    );
    return result.rows[0];
}

export async function updateCategory(categoryId: string, restaurantId: string, data: Record<string, unknown>) {
    const fieldMap: Record<string, string> = {
        name: 'name', description: 'description', sortOrder: 'sort_order', isActive: 'is_active',
    };
    const fields: string[] = []; const values: unknown[] = []; let idx = 1;
    for (const [k, col] of Object.entries(fieldMap)) {
        if (data[k] !== undefined) { fields.push(`${col} = $${idx++}`); values.push(data[k]); }
    }
    if (fields.length === 0) return null;
    values.push(categoryId, restaurantId);
    const result = await query(
        `UPDATE menu_categories SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${idx} AND restaurant_id = $${idx + 1} RETURNING *`,
        values,
    );
    return result.rows[0] || null;
}

export async function deleteCategory(categoryId: string, restaurantId: string) {
    const result = await query(
        'DELETE FROM menu_categories WHERE id = $1 AND restaurant_id = $2', [categoryId, restaurantId],
    );
    return (result.rowCount ?? 0) > 0;
}

// ---- Menu Items ----

export async function getMenuItems(restaurantId: string, categoryId: string) {
    const result = await query(
        `SELECT * FROM menu_items WHERE restaurant_id = $1 AND category_id = $2 ORDER BY sort_order, name`,
        [restaurantId, categoryId],
    );
    return result.rows;
}

export async function getMenuItemById(itemId: string) {
    const result = await query('SELECT * FROM menu_items WHERE id = $1', [itemId]);
    return result.rows[0] || null;
}

/**
 * Batch-fetch menu items by IDs — O(1) query instead of O(N).
 * Used by order service to validate all items in a single roundtrip.
 */
export async function getMenuItemsByIds(itemIds: string[]) {
    if (itemIds.length === 0) return [];
    const result = await query(
        `SELECT id, restaurant_id, category_id, name, price, discounted_price,
         food_type, status, prep_time_min, customizations
         FROM menu_items WHERE id = ANY($1::uuid[])`,
        [itemIds],
    );
    return result.rows;
}

export async function createMenuItem(restaurantId: string, categoryId: string, data: Record<string, unknown>) {
    const result = await query(
        `INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price,
         discounted_price, food_type, is_bestseller, sort_order, calories, prep_time_min, customizations)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [restaurantId, categoryId, data.name, data.description || null, data.imageUrl || null,
            data.price, data.discountedPrice || null, data.foodType || 'veg',
            data.isBestseller || false, data.sortOrder || 0, data.calories || null,
            data.prepTimeMin || null, data.customizations ? JSON.stringify(data.customizations) : null],
    );
    return result.rows[0];
}

export async function updateMenuItem(itemId: string, data: Record<string, unknown>) {
    const fieldMap: Record<string, string> = {
        name: 'name', description: 'description', imageUrl: 'image_url', price: 'price',
        discountedPrice: 'discounted_price', foodType: 'food_type', isBestseller: 'is_bestseller',
        status: 'status', sortOrder: 'sort_order', calories: 'calories',
        prepTimeMin: 'prep_time_min', customizations: 'customizations',
    };
    const fields: string[] = []; const values: unknown[] = []; let idx = 1;
    for (const [k, col] of Object.entries(fieldMap)) {
        if (data[k] !== undefined) {
            fields.push(`${col} = $${idx++}`);
            values.push(k === 'customizations' ? JSON.stringify(data[k]) : data[k]);
        }
    }
    if (fields.length === 0) return null;
    values.push(itemId);
    const result = await query(
        `UPDATE menu_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        values,
    );
    return result.rows[0] || null;
}

export async function deleteMenuItem(itemId: string) {
    const result = await query('DELETE FROM menu_items WHERE id = $1', [itemId]);
    return (result.rowCount ?? 0) > 0;
}

// ---- Public (for customer browsing) ----

export async function getActiveRestaurants(city: string, page: number, limit: number, lat: number = 0, lng: number = 0) {
    const offset = (page - 1) * limit;
    const cityFilter = city ? `AND city = '${city.replace(/'/g, "''")}'` : '';

    // If user's GPS coordinates are provided, use Haversine to filter & sort by distance
    if (lat !== 0 && lng !== 0) {
        const distanceFormula = `
            ( 6371 * acos(
                LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude)))
            ) )`;

        const countResult = await query(
            `SELECT COUNT(*) FROM restaurants
             WHERE status = 'active' ${cityFilter}
               AND latitude IS NOT NULL AND longitude IS NOT NULL
               AND ${distanceFormula} <= COALESCE(delivery_radius_km, 30)`,
            [lat, lng],
        );

        const result = await query(
            `SELECT *, ${distanceFormula} AS distance_km
             FROM restaurants
             WHERE status = 'active' ${cityFilter}
               AND latitude IS NOT NULL AND longitude IS NOT NULL
               AND ${distanceFormula} <= COALESCE(delivery_radius_km, 30)
             ORDER BY distance_km ASC, rating_avg DESC
             LIMIT $3 OFFSET $4`,
            [lat, lng, limit, offset],
        );

        return { restaurants: result.rows, total: parseInt(countResult.rows[0].count) };
    }

    // Fallback: no GPS — return all active restaurants sorted by rating
    const countResult = await query(
        `SELECT COUNT(*) FROM restaurants WHERE status = 'active' ${cityFilter}`,
    );
    const result = await query(
        `SELECT * FROM restaurants WHERE status = 'active' ${cityFilter}
         ORDER BY rating_avg DESC, total_orders DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
    );
    return { restaurants: result.rows, total: parseInt(countResult.rows[0].count) };
}

export async function getRestaurantMenu(restaurantId: string) {
    const categories = await query(
        `SELECT * FROM menu_categories WHERE restaurant_id = $1 AND is_active = TRUE ORDER BY sort_order`,
        [restaurantId],
    );
    const items = await query(
        `SELECT * FROM menu_items WHERE restaurant_id = $1 AND status = 'available' ORDER BY sort_order`,
        [restaurantId],
    );
    return { categories: categories.rows, items: items.rows };
}

/**
 * Browse menu items across all active restaurants by category keyword.
 * If lat/lng provided, restricts to restaurants within delivery radius.
 */
export async function browseItemsByCategory(
    keyword: string, lat: number = 0, lng: number = 0, limit: number = 50,
) {
    const likeTerm = `%${keyword.toLowerCase()}%`;

    const distanceFilter = (lat !== 0 && lng !== 0) ? `
        AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
        AND ( 6371 * acos(
            LEAST(1.0, cos(radians(${lat})) * cos(radians(r.latitude)) *
            cos(radians(r.longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(r.latitude)))
        ) ) <= COALESCE(r.delivery_radius_km, 30)
    ` : '';

    const result = await query(
        `SELECT mi.*, r.name AS restaurant_name, r.id AS restaurant_id,
                mc.name AS category_name
         FROM menu_items mi
         JOIN restaurants r ON mi.restaurant_id = r.id
         LEFT JOIN menu_categories mc ON mi.category_id = mc.id
         WHERE mi.status = 'available'
           AND r.status = 'active'
           AND (
             LOWER(mi.name) LIKE $1
             OR LOWER(COALESCE(mc.name, '')) LIKE $1
             OR LOWER(COALESCE(mi.description, '')) LIKE $1
             OR LOWER(r.name) LIKE $1
             OR EXISTS (SELECT 1 FROM unnest(r.cuisine_types) AS ct WHERE LOWER(ct) LIKE $1)
           )
           ${distanceFilter}
         ORDER BY mi.is_bestseller DESC, r.rating_avg DESC
         LIMIT $2`,
        [likeTerm, limit],
    );
    return result.rows;
}
