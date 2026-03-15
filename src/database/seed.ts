import { getClient } from '../config/database';
import { logger } from '../config/logger';

// ============================================================
// Database Seed — Development Data
// ============================================================
// Creates sample restaurants, menu items, customer address, and coupons
// so the app has something to display on first boot.
// Roles are already seeded by the migration.

async function seed(): Promise<void> {
    logger.info('Seeding database...');

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // --------------------------------------------------
        // 1. Create a sample user (to be the vendor owner)
        // --------------------------------------------------
        const userResult = await client.query(`
            INSERT INTO users (firebase_uid, phone, full_name, email, status, is_phone_verified)
            VALUES ('seed_vendor_uid_001', '+918021026252', 'Tassa Vendor', 'vendor@tassa.dev', 'active', TRUE)
            ON CONFLICT (firebase_uid) DO UPDATE SET full_name = EXCLUDED.full_name
            RETURNING id
        `);
        const vendorUserId = userResult.rows[0].id;

        // Assign VENDOR role
        const vendorRoleResult = await client.query(`SELECT id FROM roles WHERE name = 'VENDOR'`);
        const vendorRoleId = vendorRoleResult.rows[0].id;
        await client.query(`
            INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
            ON CONFLICT (user_id, role_id) DO NOTHING
        `, [vendorUserId, vendorRoleId]);

        // Also give them CUSTOMER role (default)
        const customerRoleResult = await client.query(`SELECT id FROM roles WHERE name = 'CUSTOMER'`);
        const customerRoleId = customerRoleResult.rows[0].id;
        await client.query(`
            INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
            ON CONFLICT (user_id, role_id) DO NOTHING
        `, [vendorUserId, customerRoleId]);

        // --------------------------------------------------
        // 2. Create vendor profile
        // --------------------------------------------------
        const vpResult = await client.query(`
            INSERT INTO vendor_profiles (user_id, business_name, fssai_license, approval_status)
            VALUES ($1, 'Tassa Kitchen', 'FSSAI123456789', 'approved')
            ON CONFLICT (user_id) DO UPDATE SET business_name = EXCLUDED.business_name
            RETURNING id
        `, [vendorUserId]);
        const vendorProfileId = vpResult.rows[0].id;

        // --------------------------------------------------
        // 3. Create a sample customer address (Kelambakkam area)
        // --------------------------------------------------
        await client.query(`
            INSERT INTO addresses (user_id, label, full_name, phone, address_line1, city, state, pincode,
                latitude, longitude, is_default)
            VALUES ($1, 'home', 'Tassa Vendor', '+918021026252',
                'Rajiv Gandhi Salai, Kelambakkam', 'Chennai', 'Tamil Nadu', '603103',
                12.8437, 80.1518, TRUE)
            ON CONFLICT DO NOTHING
        `, [vendorUserId]);

        // --------------------------------------------------
        // 4. Create sample restaurants (Kelambakkam / OMR, Chennai area)
        // --------------------------------------------------

        // Restaurant 1: Spice Garden — Indian / Biryani / Chicken (Sholinganallur, ~7km)
        const r1 = await client.query(`
            INSERT INTO restaurants (vendor_id, name, description, address_line1, city, state, pincode,
                latitude, longitude, cuisine_types, avg_cost_for_two, avg_prep_time_min,
                min_order_amount, is_pure_veg, status, is_open, rating_avg, rating_count)
            VALUES ($1, 'Spice Garden', 'Authentic Indian cuisine with fresh spices and traditional recipes',
                'OMR, Sholinganallur', 'Chennai', 'Tamil Nadu', '600119',
                12.8908, 80.2273, ARRAY['Indian','Biryani','Chicken'], 50000, 25,
                15000, FALSE, 'active', TRUE, 4.3, 128)
            ON CONFLICT DO NOTHING RETURNING id
        `, [vendorProfileId]);

        // Restaurant 2: Pizza Paradise — Pizza / Italian / Burger (Thoraipakkam, ~12km)
        const r2 = await client.query(`
            INSERT INTO restaurants (vendor_id, name, description, address_line1, city, state, pincode,
                latitude, longitude, cuisine_types, avg_cost_for_two, avg_prep_time_min,
                min_order_amount, is_pure_veg, status, is_open, rating_avg, rating_count)
            VALUES ($1, 'Pizza Paradise', 'Wood-fired pizzas, burgers, and Italian favorites',
                'Thoraipakkam, OMR', 'Chennai', 'Tamil Nadu', '600097',
                12.9363, 80.2330, ARRAY['Pizza','Italian','Burger'], 60000, 30,
                20000, FALSE, 'active', TRUE, 4.5, 256)
            ON CONFLICT DO NOTHING RETURNING id
        `, [vendorProfileId]);

        // Restaurant 3: Green Bowl — Healthy / Thali / Chinese (Siruseri, ~3km)
        const r3 = await client.query(`
            INSERT INTO restaurants (vendor_id, name, description, address_line1, city, state, pincode,
                latitude, longitude, cuisine_types, avg_cost_for_two, avg_prep_time_min,
                min_order_amount, is_pure_veg, status, is_open, rating_avg, rating_count)
            VALUES ($1, 'Green Bowl', 'Pure vegetarian thali, Chinese, and healthy bowls',
                'SIPCOT IT Park, Siruseri', 'Chennai', 'Tamil Nadu', '603103',
                12.8250, 80.1650, ARRAY['Thali','Chinese','Healthy'], 35000, 15,
                10000, TRUE, 'active', TRUE, 4.1, 89)
            ON CONFLICT DO NOTHING RETURNING id
        `, [vendorProfileId]);

        // Restaurant 4: Momos Corner — Momos / Chinese (Kelambakkam, ~1km)
        const r4 = await client.query(`
            INSERT INTO restaurants (vendor_id, name, description, address_line1, city, state, pincode,
                latitude, longitude, cuisine_types, avg_cost_for_two, avg_prep_time_min,
                min_order_amount, is_pure_veg, status, is_open, rating_avg, rating_count)
            VALUES ($1, 'Momos Corner', 'Steamed, fried, and tandoori momos with special chutneys',
                'Main Road, Kelambakkam', 'Chennai', 'Tamil Nadu', '603103',
                12.8480, 80.1560, ARRAY['Momos','Chinese','Street Food'], 20000, 15,
                8000, FALSE, 'active', TRUE, 4.6, 312)
            ON CONFLICT DO NOTHING RETURNING id
        `, [vendorProfileId]);

        // Restaurant 5: Chicken Hub — Chicken / Burger (Navalur, ~9km)
        const r5 = await client.query(`
            INSERT INTO restaurants (vendor_id, name, description, address_line1, city, state, pincode,
                latitude, longitude, cuisine_types, avg_cost_for_two, avg_prep_time_min,
                min_order_amount, is_pure_veg, status, is_open, rating_avg, rating_count)
            VALUES ($1, 'Chicken Hub', 'Crispy fried chicken, juicy burgers, and shawarma',
                'Navalur Junction, OMR', 'Chennai', 'Tamil Nadu', '600130',
                12.8465, 80.2268, ARRAY['Chicken','Burger','Fast Food'], 40000, 20,
                12000, FALSE, 'active', TRUE, 4.4, 189)
            ON CONFLICT DO NOTHING RETURNING id
        `, [vendorProfileId]);

        // Restaurant 6: Royal Desserts — Dessert / Sweets (Padur, ~3km)
        const r6 = await client.query(`
            INSERT INTO restaurants (vendor_id, name, description, address_line1, city, state, pincode,
                latitude, longitude, cuisine_types, avg_cost_for_two, avg_prep_time_min,
                min_order_amount, is_pure_veg, status, is_open, rating_avg, rating_count)
            VALUES ($1, 'Royal Desserts', 'Traditional Indian sweets, ice cream, and desserts',
                'Padur Main Road', 'Chennai', 'Tamil Nadu', '603103',
                12.8370, 80.1760, ARRAY['Dessert','Sweets','Ice Cream'], 25000, 10,
                5000, TRUE, 'active', TRUE, 4.7, 420)
            ON CONFLICT DO NOTHING RETURNING id
        `, [vendorProfileId]);

        // --------------------------------------------------
        // 5. Create menu categories & items for each restaurant
        // --------------------------------------------------

        // ---- Spice Garden (Indian/Biryani/Chicken) ----
        if (r1.rows.length > 0) {
            const restId = r1.rows[0].id;
            const c1 = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Starters', 1) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);
            const c2 = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Main Course', 2) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);
            const c3 = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Biryani', 3) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);

            if (c1.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Paneer Tikka', 'Smoky grilled cottage cheese with spices', 22900, 'veg', TRUE, 'available', 15),
                    ($1, $2, 'Chicken 65', 'Spicy deep-fried chicken bites', 24900, 'non_veg', TRUE, 'available', 15),
                    ($1, $2, 'Masala Papad', 'Crispy papad topped with onion-tomato mix', 9900, 'veg', FALSE, 'available', 5)
                    ON CONFLICT DO NOTHING
                `, [restId, c1.rows[0].id]);
            }
            if (c2.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Butter Chicken', 'Creamy tomato-based chicken curry', 29900, 'non_veg', TRUE, 'available', 25),
                    ($1, $2, 'Dal Makhani', 'Slow-cooked black lentils in butter cream', 21900, 'veg', TRUE, 'available', 30),
                    ($1, $2, 'Palak Paneer', 'Cottage cheese in creamy spinach gravy', 22900, 'veg', FALSE, 'available', 20),
                    ($1, $2, 'Butter Naan', 'Soft tandoori bread brushed with butter', 5900, 'veg', FALSE, 'available', 8),
                    ($1, $2, 'Jeera Rice', 'Basmati rice tempered with cumin', 14900, 'veg', FALSE, 'available', 15)
                    ON CONFLICT DO NOTHING
                `, [restId, c2.rows[0].id]);
            }
            if (c3.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Hyderabadi Chicken Biryani', 'Dum-cooked aromatic basmati with tender chicken', 29900, 'non_veg', TRUE, 'available', 30),
                    ($1, $2, 'Veg Biryani', 'Fragrant rice with mixed vegetables', 22900, 'veg', FALSE, 'available', 25),
                    ($1, $2, 'Mutton Biryani', 'Rich and aromatic mutton dum biryani', 34900, 'non_veg', TRUE, 'available', 35)
                    ON CONFLICT DO NOTHING
                `, [restId, c3.rows[0].id]);
            }
        }

        // ---- Pizza Paradise (Pizza/Italian/Burger) ----
        if (r2.rows.length > 0) {
            const restId = r2.rows[0].id;
            const cp = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Pizzas', 1) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);
            const cb = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Burgers', 2) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);
            const cs = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Sides', 3) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);

            if (cp.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Margherita', 'Classic tomato sauce, fresh mozzarella, basil', 24900, NULL, 'veg', TRUE, 'available', 20),
                    ($1, $2, 'Pepperoni Feast', 'Loaded pepperoni with extra cheese', 34900, 29900, 'non_veg', TRUE, 'available', 25),
                    ($1, $2, 'Farmhouse Veggie', 'Bell peppers, mushrooms, onions, olives', 29900, NULL, 'veg', FALSE, 'available', 20),
                    ($1, $2, 'BBQ Chicken', 'Smoky BBQ chicken with caramelized onions', 34900, NULL, 'non_veg', TRUE, 'available', 25)
                    ON CONFLICT DO NOTHING
                `, [restId, cp.rows[0].id]);
            }
            if (cb.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Classic Chicken Burger', 'Grilled chicken patty with fresh veggies', 17900, 'non_veg', TRUE, 'available', 15),
                    ($1, $2, 'Veg Cheese Burger', 'Crispy veg patty with cheese slice', 14900, 'veg', FALSE, 'available', 12),
                    ($1, $2, 'Double Smash Burger', 'Double beef patty with special sauce', 24900, 'non_veg', TRUE, 'available', 18)
                    ON CONFLICT DO NOTHING
                `, [restId, cb.rows[0].id]);
            }
            if (cs.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, status, prep_time_min) VALUES
                    ($1, $2, 'Garlic Bread', 'Toasted bread with garlic butter', 14900, 'veg', 'available', 10),
                    ($1, $2, 'Cheesy Fries', 'Crispy fries topped with melted cheese', 16900, 'veg', 'available', 12),
                    ($1, $2, 'Chicken Wings', 'Spicy buffalo chicken wings', 22900, 'non_veg', 'available', 15)
                    ON CONFLICT DO NOTHING
                `, [restId, cs.rows[0].id]);
            }
        }

        // ---- Green Bowl (Thali/Chinese/Healthy) ----
        if (r3.rows.length > 0) {
            const restId = r3.rows[0].id;
            const ct = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Thali', 1) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);
            const cc = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Chinese', 2) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);
            const cd = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Drinks', 3) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);

            if (ct.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Paneer Special Thali', 'Paneer curry, dal, rice, roti, salad, sweet', 19900, 'veg', TRUE, 'available', 15),
                    ($1, $2, 'Rajasthani Thali', 'Dal bati churma, gatte ki sabzi, raita, rice', 22900, 'veg', TRUE, 'available', 20),
                    ($1, $2, 'South Indian Thali', 'Sambhar, rasam, rice, poriyal, curd, papad', 17900, 'veg', FALSE, 'available', 15)
                    ON CONFLICT DO NOTHING
                `, [restId, ct.rows[0].id]);
            }
            if (cc.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Veg Manchurian', 'Crispy vegetable balls in spicy sauce', 17900, 'veg', TRUE, 'available', 15),
                    ($1, $2, 'Hakka Noodles', 'Stir-fried noodles with vegetables', 15900, 'veg', FALSE, 'available', 12),
                    ($1, $2, 'Fried Rice', 'Flavoured rice with mixed veggies', 14900, 'veg', FALSE, 'available', 12),
                    ($1, $2, 'Spring Rolls', 'Crispy rolls filled with cabbage and carrots', 12900, 'veg', FALSE, 'available', 10)
                    ON CONFLICT DO NOTHING
                `, [restId, cc.rows[0].id]);
            }
            if (cd.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, status, prep_time_min) VALUES
                    ($1, $2, 'Mango Lassi', 'Thick mango yogurt drink', 12900, 'veg', 'available', 5),
                    ($1, $2, 'Masala Chai', 'Indian spiced tea', 4900, 'veg', 'available', 5),
                    ($1, $2, 'Fresh Lime Soda', 'Refreshing lime soda, sweet or salted', 7900, 'veg', 'available', 3)
                    ON CONFLICT DO NOTHING
                `, [restId, cd.rows[0].id]);
            }
        }

        // ---- Momos Corner (Momos/Chinese) ----
        if (r4.rows.length > 0) {
            const restId = r4.rows[0].id;
            const cm = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Momos', 1) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);

            if (cm.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Steamed Chicken Momos', 'Juicy chicken momos with spicy chutney', 12000, 'non_veg', TRUE, 'available', 12),
                    ($1, $2, 'Steamed Veg Momos', 'Cabbage and carrot filled momos', 10000, 'veg', TRUE, 'available', 12),
                    ($1, $2, 'Fried Chicken Momos', 'Crispy fried chicken momos', 14000, 'non_veg', TRUE, 'available', 15),
                    ($1, $2, 'Tandoori Momos', 'Baked momos with tandoori masala coating', 15000, 'non_veg', TRUE, 'available', 18),
                    ($1, $2, 'Kurkure Momos', 'Extra crunchy coated momos', 14000, 'non_veg', FALSE, 'available', 15),
                    ($1, $2, 'Afghani Momos', 'Creamy afghani-style momos', 16000, 'non_veg', TRUE, 'available', 18)
                    ON CONFLICT DO NOTHING
                `, [restId, cm.rows[0].id]);
            }
        }

        // ---- Chicken Hub (Chicken/Burger) ----
        if (r5.rows.length > 0) {
            const restId = r5.rows[0].id;
            const ck = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Chicken', 1) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);
            const cbb = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Burgers', 2) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);

            if (ck.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Fried Chicken (4 pcs)', '4 pieces crispy fried chicken', 24900, 'non_veg', TRUE, 'available', 15),
                    ($1, $2, 'Chicken Shawarma', 'Juicy chicken wrap with garlic sauce', 14900, 'non_veg', TRUE, 'available', 12),
                    ($1, $2, 'Grilled Chicken', 'Herb-marinated grilled chicken breast', 27900, 'non_veg', FALSE, 'available', 20),
                    ($1, $2, 'Chicken Lollipop', 'Crispy chicken drumlets with spicy coating', 22900, 'non_veg', TRUE, 'available', 15)
                    ON CONFLICT DO NOTHING
                `, [restId, ck.rows[0].id]);
            }
            if (cbb.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Zinger Burger', 'Spicy crispy chicken fillet burger', 17900, 'non_veg', TRUE, 'available', 12),
                    ($1, $2, 'Chicken Cheese Burst', 'Double cheese melt with grilled chicken', 21900, 'non_veg', TRUE, 'available', 15)
                    ON CONFLICT DO NOTHING
                `, [restId, cbb.rows[0].id]);
            }
        }

        // ---- Royal Desserts (Dessert/Sweets) ----
        if (r6.rows.length > 0) {
            const restId = r6.rows[0].id;
            const cds = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Sweets', 1) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);
            const cic = await client.query(`
                INSERT INTO menu_categories (restaurant_id, name, sort_order)
                VALUES ($1, 'Ice Cream', 2) ON CONFLICT (restaurant_id, name) DO NOTHING RETURNING id
            `, [restId]);

            if (cds.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Gulab Jamun (4 pcs)', 'Soft melt-in-mouth milk dumplings in sugar syrup', 9900, 'veg', TRUE, 'available', 5),
                    ($1, $2, 'Ras Malai', 'Soft paneer discs soaked in saffron milk', 12900, 'veg', TRUE, 'available', 5),
                    ($1, $2, 'Jalebi (250g)', 'Crispy golden spirals dipped in sugar syrup', 7900, 'veg', FALSE, 'available', 10),
                    ($1, $2, 'Brownie With Ice Cream', 'Warm chocolate brownie with vanilla ice cream', 15900, 'veg', TRUE, 'available', 8)
                    ON CONFLICT DO NOTHING
                `, [restId, cds.rows[0].id]);
            }
            if (cic.rows.length > 0) {
                await client.query(`
                    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, food_type, is_bestseller, status, prep_time_min) VALUES
                    ($1, $2, 'Vanilla Scoop', 'Classic vanilla ice cream', 6900, 'veg', FALSE, 'available', 2),
                    ($1, $2, 'Chocolate Fudge Sundae', 'Rich chocolate ice cream with fudge topping', 14900, 'veg', TRUE, 'available', 5),
                    ($1, $2, 'Mango Kulfi', 'Traditional Indian mango ice cream', 8900, 'veg', TRUE, 'available', 3)
                    ON CONFLICT DO NOTHING
                `, [restId, cic.rows[0].id]);
            }
        }

        // --------------------------------------------------
        // 6. Create sample coupons
        // --------------------------------------------------
        await client.query(`
            INSERT INTO coupons (code, description, discount_type, discount_value, max_discount,
                min_order_amount, max_uses_total, max_uses_per_user, valid_from, valid_until, is_active)
            VALUES ('WELCOME50', '50% off on your first order', 'percentage', 50, 15000,
                20000, 1000, 1, NOW(), NOW() + INTERVAL '90 days', TRUE)
            ON CONFLICT (code) DO NOTHING
        `);

        await client.query(`
            INSERT INTO coupons (code, description, discount_type, discount_value, max_discount,
                min_order_amount, max_uses_total, max_uses_per_user, valid_from, valid_until, is_active)
            VALUES ('FLAT100', 'Flat ₹100 off on orders above ₹300', 'flat', 10000, NULL,
                30000, 5000, 3, NOW(), NOW() + INTERVAL '60 days', TRUE)
            ON CONFLICT (code) DO NOTHING
        `);

        await client.query('COMMIT');
        logger.info('✅ Seeding complete — 6 restaurants (Chennai/Kelambakkam) with menus, 1 address, and 2 coupons created');
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Seeding failed', { error: err instanceof Error ? err.message : err });
        throw err;
    } finally {
        client.release();
    }
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        logger.error('Seeding failed', { error: err.message });
        process.exit(1);
    });
