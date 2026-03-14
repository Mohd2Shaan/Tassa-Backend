-- ============================================================
-- Sample Data: 15 Categories + 60 Menu Items for 5 Restaurants
-- Location: Chennai, OMR area (~30km radius)
-- ============================================================

-- First, let's get the restaurant IDs we just inserted
-- We'll use a CTE to get IDs by restaurant name

-- NOTE: Run this AFTER inserting the 5 restaurants

-- ============================================================
-- RESTAURANT 1: Tassa Biryani House (Hyderabadi Biryani & Kebabs)
-- ============================================================

-- Categories for Tassa Biryani House
DO $$
DECLARE
    r1_id UUID;
    cat_biryani UUID;
    cat_kebabs UUID;
    cat_starters UUID;
BEGIN
    SELECT id INTO r1_id FROM restaurants WHERE name = 'Tassa Biryani House' LIMIT 1;
    
    IF r1_id IS NOT NULL THEN
        -- Insert categories
        INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order, is_active)
        VALUES 
            (gen_random_uuid(), r1_id, 'Biryani', 'Authentic Hyderabadi Dum Biryani', 1, true),
            (gen_random_uuid(), r1_id, 'Kebabs & Grills', 'Charcoal grilled kebabs', 2, true),
            (gen_random_uuid(), r1_id, 'Starters', 'Appetizers and snacks', 3, true)
        RETURNING id INTO cat_biryani;
        
        SELECT id INTO cat_biryani FROM menu_categories WHERE restaurant_id = r1_id AND name = 'Biryani';
        SELECT id INTO cat_kebabs FROM menu_categories WHERE restaurant_id = r1_id AND name = 'Kebabs & Grills';
        SELECT id INTO cat_starters FROM menu_categories WHERE restaurant_id = r1_id AND name = 'Starters';
        
        -- Menu Items - Biryani
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r1_id, cat_biryani, 'Chicken Dum Biryani', 'Slow-cooked Hyderabadi biryani with tender chicken, saffron rice & raita', 28900, 24900, 'non_veg', true, 'available', 1),
            (gen_random_uuid(), r1_id, cat_biryani, 'Mutton Dum Biryani', 'Traditional mutton biryani with aromatic spices & caramelized onions', 34900, NULL, 'non_veg', true, 'available', 2),
            (gen_random_uuid(), r1_id, cat_biryani, 'Egg Biryani', 'Fragrant basmati rice with boiled eggs & special masala', 19900, 17900, 'egg', false, 'available', 3),
            (gen_random_uuid(), r1_id, cat_biryani, 'Veg Dum Biryani', 'Paneer, vegetables & saffron rice cooked in dum style', 22900, NULL, 'veg', false, 'available', 4);
        
        -- Menu Items - Kebabs
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r1_id, cat_kebabs, 'Seekh Kebab (6 pcs)', 'Minced lamb kebabs with mint chutney', 26900, NULL, 'non_veg', true, 'available', 1),
            (gen_random_uuid(), r1_id, cat_kebabs, 'Chicken Tikka (8 pcs)', 'Boneless chicken marinated in yogurt & spices', 24900, 21900, 'non_veg', false, 'available', 2),
            (gen_random_uuid(), r1_id, cat_kebabs, 'Tangdi Kebab (4 pcs)', 'Whole leg pieces grilled to perfection', 29900, NULL, 'non_veg', false, 'available', 3),
            (gen_random_uuid(), r1_id, cat_kebabs, 'Paneer Tikka (8 pcs)', 'Cottage cheese marinated & grilled', 21900, NULL, 'veg', false, 'available', 4);
        
        -- Menu Items - Starters
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r1_id, cat_starters, 'Chicken 65', 'Spicy deep-fried chicken with curry leaves', 22900, 19900, 'non_veg', true, 'available', 1),
            (gen_random_uuid(), r1_id, cat_starters, 'Mutton Cutlet (4 pcs)', 'Crispy minced mutton cutlets', 18900, NULL, 'non_veg', false, 'available', 2),
            (gen_random_uuid(), r1_id, cat_starters, 'Mirchi Bajji (6 pcs)', 'Stuffed chili fritters', 12900, NULL, 'veg', false, 'available', 3),
            (gen_random_uuid(), r1_id, cat_starters, 'Onion Pakoda', 'Crispy onion fritters with green chutney', 9900, NULL, 'veg', false, 'available', 4);
    END IF;
END $$;

-- ============================================================
-- RESTAURANT 2: Spice Route Kitchen (South Indian Meals & Tiffin)
-- ============================================================

DO $$
DECLARE
    r2_id UUID;
    cat_meals UUID;
    cat_dosa UUID;
    cat_idli UUID;
BEGIN
    SELECT id INTO r2_id FROM restaurants WHERE name = 'Spice Route Kitchen' LIMIT 1;
    
    IF r2_id IS NOT NULL THEN
        -- Insert categories
        INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order, is_active)
        VALUES 
            (gen_random_uuid(), r2_id, 'Meals', 'Traditional South Indian Thali', 1, true),
            (gen_random_uuid(), r2_id, 'Dosa Varieties', 'Crispy dosas with chutneys', 2, true),
            (gen_random_uuid(), r2_id, 'Idli & Vada', 'Steamed idlis and crispy vadas', 3, true);
        
        SELECT id INTO cat_meals FROM menu_categories WHERE restaurant_id = r2_id AND name = 'Meals';
        SELECT id INTO cat_dosa FROM menu_categories WHERE restaurant_id = r2_id AND name = 'Dosa Varieties';
        SELECT id INTO cat_idli FROM menu_categories WHERE restaurant_id = r2_id AND name = 'Idli & Vada';
        
        -- Menu Items - Meals
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r2_id, cat_meals, 'Veg Meals (Unlimited)', 'Rice, sambar, rasam, poriyal, kootu, curd, papad, pickle, payasam', 14900, 12900, 'veg', true, 'available', 1),
            (gen_random_uuid(), r2_id, cat_meals, 'Non-Veg Meals', 'Rice with chicken curry, rasam, poriyal, curd', 18900, NULL, 'non_veg', false, 'available', 2),
            (gen_random_uuid(), r2_id, cat_meals, 'Mini Meals', 'Compact thali with rice, sambar, rasam, poriyal', 9900, NULL, 'veg', false, 'available', 3),
            (gen_random_uuid(), r2_id, cat_meals, 'Curd Rice', 'Tempered curd rice with pickle', 7900, NULL, 'veg', false, 'available', 4);
        
        -- Menu Items - Dosa
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r2_id, cat_dosa, 'Plain Dosa', 'Crispy golden dosa with sambar & chutneys', 6900, NULL, 'veg', false, 'available', 1),
            (gen_random_uuid(), r2_id, cat_dosa, 'Masala Dosa', 'Crispy dosa stuffed with spiced potato filling', 8900, 7900, 'veg', true, 'available', 2),
            (gen_random_uuid(), r2_id, cat_dosa, 'Ghee Roast Dosa', 'Extra crispy dosa roasted in pure ghee', 9900, NULL, 'veg', true, 'available', 3),
            (gen_random_uuid(), r2_id, cat_dosa, 'Mysore Masala Dosa', 'Spicy red chutney spread dosa with potato', 10900, NULL, 'veg', false, 'available', 4);
        
        -- Menu Items - Idli & Vada
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r2_id, cat_idli, 'Idli (3 pcs)', 'Soft steamed rice cakes with chutney & sambar', 4900, NULL, 'veg', false, 'available', 1),
            (gen_random_uuid(), r2_id, cat_idli, 'Medu Vada (2 pcs)', 'Crispy lentil donuts with coconut chutney', 5900, NULL, 'veg', true, 'available', 2),
            (gen_random_uuid(), r2_id, cat_idli, 'Idli Vada Combo', '2 Idli + 1 Vada with sambar & chutney', 6900, 5900, 'veg', false, 'available', 3),
            (gen_random_uuid(), r2_id, cat_idli, 'Pongal Vada', 'Hot pongal with crispy vada', 8900, NULL, 'veg', false, 'available', 4);
    END IF;
END $$;

-- ============================================================
-- RESTAURANT 3: Tassa Street Food (Fast snacks & rolls)
-- ============================================================

DO $$
DECLARE
    r3_id UUID;
    cat_rolls UUID;
    cat_chaats UUID;
    cat_momos UUID;
BEGIN
    SELECT id INTO r3_id FROM restaurants WHERE name = 'Tassa Street Food' LIMIT 1;
    
    IF r3_id IS NOT NULL THEN
        -- Insert categories
        INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order, is_active)
        VALUES 
            (gen_random_uuid(), r3_id, 'Rolls & Wraps', 'Kathi rolls and frankie wraps', 1, true),
            (gen_random_uuid(), r3_id, 'Chaats', 'Delhi-style street chaats', 2, true),
            (gen_random_uuid(), r3_id, 'Momos', 'Steamed and fried dumplings', 3, true);
        
        SELECT id INTO cat_rolls FROM menu_categories WHERE restaurant_id = r3_id AND name = 'Rolls & Wraps';
        SELECT id INTO cat_chaats FROM menu_categories WHERE restaurant_id = r3_id AND name = 'Chaats';
        SELECT id INTO cat_momos FROM menu_categories WHERE restaurant_id = r3_id AND name = 'Momos';
        
        -- Menu Items - Rolls
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r3_id, cat_rolls, 'Chicken Kathi Roll', 'Spiced chicken wrapped in paratha with onions & chutney', 12900, 10900, 'non_veg', true, 'available', 1),
            (gen_random_uuid(), r3_id, cat_rolls, 'Egg Roll', 'Egg wrapped in paratha with veggies', 8900, NULL, 'egg', false, 'available', 2),
            (gen_random_uuid(), r3_id, cat_rolls, 'Paneer Tikka Roll', 'Grilled paneer wrapped in rumali roti', 11900, NULL, 'veg', true, 'available', 3),
            (gen_random_uuid(), r3_id, cat_rolls, 'Double Chicken Roll', 'Extra loaded chicken roll for big appetite', 16900, 14900, 'non_veg', false, 'available', 4);
        
        -- Menu Items - Chaats
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r3_id, cat_chaats, 'Pani Puri (6 pcs)', 'Crispy puris with spiced water & potato', 6900, NULL, 'veg', true, 'available', 1),
            (gen_random_uuid(), r3_id, cat_chaats, 'Bhel Puri', 'Puffed rice with chutneys & veggies', 7900, NULL, 'veg', false, 'available', 2),
            (gen_random_uuid(), r3_id, cat_chaats, 'Dahi Puri', 'Puris filled with yogurt & chutneys', 8900, 7500, 'veg', false, 'available', 3),
            (gen_random_uuid(), r3_id, cat_chaats, 'Aloo Tikki Chaat', 'Crispy potato patties with curd & chutneys', 9900, NULL, 'veg', true, 'available', 4);
        
        -- Menu Items - Momos
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r3_id, cat_momos, 'Steamed Chicken Momos (8 pcs)', 'Juicy chicken dumplings with spicy chutney', 11900, 9900, 'non_veg', true, 'available', 1),
            (gen_random_uuid(), r3_id, cat_momos, 'Fried Veg Momos (8 pcs)', 'Crispy fried vegetable dumplings', 9900, NULL, 'veg', false, 'available', 2),
            (gen_random_uuid(), r3_id, cat_momos, 'Pan Fried Momos (8 pcs)', 'Half steamed, half fried chicken momos', 13900, NULL, 'non_veg', false, 'available', 3),
            (gen_random_uuid(), r3_id, cat_momos, 'Tandoori Momos (8 pcs)', 'Clay oven roasted momos with tikka masala', 14900, 12900, 'non_veg', true, 'available', 4);
    END IF;
END $$;

-- ============================================================
-- RESTAURANT 4: Madras Dosa Corner (Crispy dosa & filter coffee)
-- ============================================================

DO $$
DECLARE
    r4_id UUID;
    cat_special_dosa UUID;
    cat_uttapam UUID;
    cat_beverages UUID;
BEGIN
    SELECT id INTO r4_id FROM restaurants WHERE name = 'Madras Dosa Corner' LIMIT 1;
    
    IF r4_id IS NOT NULL THEN
        -- Insert categories
        INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order, is_active)
        VALUES 
            (gen_random_uuid(), r4_id, 'Special Dosas', 'Chef special dosa varieties', 1, true),
            (gen_random_uuid(), r4_id, 'Uttapam', 'Thick savory pancakes', 2, true),
            (gen_random_uuid(), r4_id, 'Beverages', 'Filter coffee & traditional drinks', 3, true);
        
        SELECT id INTO cat_special_dosa FROM menu_categories WHERE restaurant_id = r4_id AND name = 'Special Dosas';
        SELECT id INTO cat_uttapam FROM menu_categories WHERE restaurant_id = r4_id AND name = 'Uttapam';
        SELECT id INTO cat_beverages FROM menu_categories WHERE restaurant_id = r4_id AND name = 'Beverages';
        
        -- Menu Items - Special Dosas
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r4_id, cat_special_dosa, 'Paper Roast', '2 feet crispy paper thin dosa', 10900, 8900, 'veg', true, 'available', 1),
            (gen_random_uuid(), r4_id, cat_special_dosa, 'Cheese Masala Dosa', 'Masala dosa loaded with cheese', 12900, NULL, 'veg', true, 'available', 2),
            (gen_random_uuid(), r4_id, cat_special_dosa, 'Podi Dosa', 'Dosa with spicy gun powder', 8900, NULL, 'veg', false, 'available', 3),
            (gen_random_uuid(), r4_id, cat_special_dosa, '70mm Dosa', 'Extra thick and fluffy dosa', 11900, 9900, 'veg', false, 'available', 4);
        
        -- Menu Items - Uttapam
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r4_id, cat_uttapam, 'Onion Uttapam', 'Thick pancake topped with onions', 7900, NULL, 'veg', false, 'available', 1),
            (gen_random_uuid(), r4_id, cat_uttapam, 'Mixed Veg Uttapam', 'Topped with tomato, onion, capsicum', 8900, 7500, 'veg', true, 'available', 2),
            (gen_random_uuid(), r4_id, cat_uttapam, 'Cheese Uttapam', 'Uttapam loaded with cheese', 10900, NULL, 'veg', false, 'available', 3),
            (gen_random_uuid(), r4_id, cat_uttapam, 'Egg Uttapam', 'Uttapam cooked with egg on top', 9900, NULL, 'egg', false, 'available', 4);
        
        -- Menu Items - Beverages
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r4_id, cat_beverages, 'Filter Coffee', 'Traditional South Indian filter coffee', 3900, NULL, 'veg', true, 'available', 1),
            (gen_random_uuid(), r4_id, cat_beverages, 'Madras Coffee (Large)', 'Extra strong filter coffee', 5900, 4900, 'veg', true, 'available', 2),
            (gen_random_uuid(), r4_id, cat_beverages, 'Buttermilk', 'Spiced chaas with curry leaves', 3500, NULL, 'veg', false, 'available', 3),
            (gen_random_uuid(), r4_id, cat_beverages, 'Badam Milk', 'Hot almond milk with saffron', 6900, NULL, 'veg', false, 'available', 4);
    END IF;
END $$;

-- ============================================================
-- RESTAURANT 5: Coastal Curry Kitchen (Seafood & Chettinad specials)
-- ============================================================

DO $$
DECLARE
    r5_id UUID;
    cat_seafood UUID;
    cat_chettinad UUID;
    cat_rice UUID;
BEGIN
    SELECT id INTO r5_id FROM restaurants WHERE name = 'Coastal Curry Kitchen' LIMIT 1;
    
    IF r5_id IS NOT NULL THEN
        -- Insert categories
        INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order, is_active)
        VALUES 
            (gen_random_uuid(), r5_id, 'Seafood', 'Fresh catch from the coast', 1, true),
            (gen_random_uuid(), r5_id, 'Chettinad Specials', 'Authentic Chettinad cuisine', 2, true),
            (gen_random_uuid(), r5_id, 'Rice & Breads', 'Accompaniments', 3, true);
        
        SELECT id INTO cat_seafood FROM menu_categories WHERE restaurant_id = r5_id AND name = 'Seafood';
        SELECT id INTO cat_chettinad FROM menu_categories WHERE restaurant_id = r5_id AND name = 'Chettinad Specials';
        SELECT id INTO cat_rice FROM menu_categories WHERE restaurant_id = r5_id AND name = 'Rice & Breads';
        
        -- Menu Items - Seafood
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r5_id, cat_seafood, 'Fish Fry (2 pcs)', 'Seer fish marinated & shallow fried', 28900, 24900, 'non_veg', true, 'available', 1),
            (gen_random_uuid(), r5_id, cat_seafood, 'Prawn Masala', 'Jumbo prawns in spicy coastal gravy', 32900, NULL, 'non_veg', true, 'available', 2),
            (gen_random_uuid(), r5_id, cat_seafood, 'Crab Roast', 'Whole crab in Kerala style roast masala', 44900, 39900, 'non_veg', false, 'available', 3),
            (gen_random_uuid(), r5_id, cat_seafood, 'Fish Curry', 'Kingfish in tangy tamarind gravy', 24900, NULL, 'non_veg', false, 'available', 4);
        
        -- Menu Items - Chettinad
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r5_id, cat_chettinad, 'Chettinad Chicken', 'Spicy chicken curry with freshly ground masala', 26900, 22900, 'non_veg', true, 'available', 1),
            (gen_random_uuid(), r5_id, cat_chettinad, 'Chettinad Mutton', 'Tender mutton in rich Chettinad gravy', 32900, NULL, 'non_veg', true, 'available', 2),
            (gen_random_uuid(), r5_id, cat_chettinad, 'Pepper Chicken Dry', 'Boneless chicken with black pepper', 24900, NULL, 'non_veg', false, 'available', 3),
            (gen_random_uuid(), r5_id, cat_chettinad, 'Egg Curry (4 eggs)', 'Boiled eggs in Chettinad gravy', 16900, 14900, 'egg', false, 'available', 4);
        
        -- Menu Items - Rice & Breads
        INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, discounted_price, food_type, is_bestseller, status, sort_order)
        VALUES
            (gen_random_uuid(), r5_id, cat_rice, 'Steamed Rice', 'Plain basmati rice', 6900, NULL, 'veg', false, 'available', 1),
            (gen_random_uuid(), r5_id, cat_rice, 'Ghee Rice', 'Basmati rice cooked in ghee', 8900, NULL, 'veg', false, 'available', 2),
            (gen_random_uuid(), r5_id, cat_rice, 'Parotta (2 pcs)', 'Layered flaky parotta', 4900, NULL, 'veg', true, 'available', 3),
            (gen_random_uuid(), r5_id, cat_rice, 'Appam (2 pcs)', 'Lacy rice hoppers', 5900, 4900, 'veg', false, 'available', 4);
    END IF;
END $$;

-- ============================================================
-- Summary: 
-- 5 Restaurants × 3 Categories each = 15 Categories
-- 5 Restaurants × 12 Items each = 60 Menu Items
-- ============================================================
