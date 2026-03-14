-- ============================================================
-- Migration 001: Initial Schema
-- Creates all core tables for the Tassa platform.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE restaurant_status AS ENUM ('pending_approval', 'active', 'inactive', 'suspended', 'rejected');
CREATE TYPE menu_item_status AS ENUM ('available', 'out_of_stock', 'hidden');
CREATE TYPE order_status AS ENUM (
    'pending', 'payment_failed', 'confirmed',
    'vendor_accepted', 'vendor_rejected', 'preparing',
    'ready_for_pickup', 'delivery_assigned', 'picked_up',
    'out_for_delivery', 'delivered',
    'cancelled_by_customer', 'cancelled_by_vendor', 'cancelled_by_admin',
    'refund_initiated', 'refund_completed'
);
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refund_initiated', 'refunded', 'partially_refunded');
CREATE TYPE payment_method AS ENUM ('upi', 'card', 'netbanking', 'wallet', 'cod');
CREATE TYPE delivery_status AS ENUM ('pending_assignment', 'assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('order_update', 'payment_update', 'delivery_update', 'promotional', 'system');
CREATE TYPE food_type AS ENUM ('veg', 'non_veg', 'egg');
CREATE TYPE address_type AS ENUM ('home', 'work', 'other');

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
    id          SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name        VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
    ('CUSTOMER', 'End user who orders food'),
    ('VENDOR', 'Restaurant owner / food seller'),
    ('DELIVERY_PARTNER', 'Delivery rider'),
    ('ADMIN', 'Platform administrator');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid      VARCHAR(128) UNIQUE NOT NULL,
    phone             VARCHAR(15) NOT NULL UNIQUE,
    full_name         VARCHAR(100),
    email             VARCHAR(255),
    avatar_url        TEXT,
    status            user_status NOT NULL DEFAULT 'active',
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users (phone);
CREATE INDEX idx_users_firebase_uid ON users (firebase_uid);
CREATE INDEX idx_users_status ON users (status);

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE user_roles (
    id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by  UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    device_info     VARCHAR(255),
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at) WHERE is_revoked = FALSE;

-- ============================================================
-- OTP LOGS
-- ============================================================
CREATE TABLE otp_logs (
    id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    phone           VARCHAR(15) NOT NULL,
    otp_type        VARCHAR(20) NOT NULL DEFAULT 'login',
    ip_address      INET,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    attempts        SMALLINT NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at     TIMESTAMPTZ
);

CREATE INDEX idx_otp_logs_phone_created ON otp_logs (phone, created_at DESC);

-- ============================================================
-- VENDOR PROFILES
-- ============================================================
CREATE TABLE vendor_profiles (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name     VARCHAR(150) NOT NULL,
    fssai_license     VARCHAR(20),
    gst_number        VARCHAR(20),
    pan_number        VARCHAR(12),
    bank_account_no   VARCHAR(20),
    bank_ifsc         VARCHAR(15),
    bank_name         VARCHAR(100),
    approval_status   approval_status NOT NULL DEFAULT 'pending',
    approved_by       UUID REFERENCES users(id),
    approved_at       TIMESTAMPTZ,
    rejection_reason  TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_profiles_user_id ON vendor_profiles (user_id);
CREATE INDEX idx_vendor_profiles_approval ON vendor_profiles (approval_status);

-- ============================================================
-- RESTAURANTS
-- ============================================================
CREATE TABLE restaurants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id           UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    name                VARCHAR(150) NOT NULL,
    description         TEXT,
    phone               VARCHAR(15),
    email               VARCHAR(255),
    logo_url            TEXT,
    cover_image_url     TEXT,
    address_line1       VARCHAR(255) NOT NULL,
    address_line2       VARCHAR(255),
    city                VARCHAR(100) NOT NULL,
    state               VARCHAR(100) NOT NULL,
    pincode             VARCHAR(10) NOT NULL,
    latitude            DECIMAL(10, 7) NOT NULL,
    longitude           DECIMAL(10, 7) NOT NULL,
    cuisine_types       TEXT[] NOT NULL DEFAULT '{}',
    avg_cost_for_two    INTEGER,
    avg_prep_time_min   SMALLINT NOT NULL DEFAULT 30,
    min_order_amount    INTEGER NOT NULL DEFAULT 0,
    delivery_radius_km  DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
    is_pure_veg         BOOLEAN NOT NULL DEFAULT FALSE,
    has_dining          BOOLEAN NOT NULL DEFAULT FALSE,
    status              restaurant_status NOT NULL DEFAULT 'pending_approval',
    is_open             BOOLEAN NOT NULL DEFAULT FALSE,
    rating_avg          DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    rating_count        INTEGER NOT NULL DEFAULT 0,
    total_orders        INTEGER NOT NULL DEFAULT 0,
    opening_hours       JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_vendor_id ON restaurants (vendor_id);
CREATE INDEX idx_restaurants_status ON restaurants (status) WHERE status = 'active';
CREATE INDEX idx_restaurants_cuisine ON restaurants USING GIN (cuisine_types);
CREATE INDEX idx_restaurants_city ON restaurants (city);
CREATE INDEX idx_restaurants_pincode ON restaurants (pincode);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
CREATE TABLE menu_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(255),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, name)
);

CREATE INDEX idx_menu_categories_restaurant ON menu_categories (restaurant_id);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE menu_items (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id     UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id       UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name              VARCHAR(150) NOT NULL,
    description       TEXT,
    image_url         TEXT,
    price             INTEGER NOT NULL,
    discounted_price  INTEGER,
    food_type         food_type NOT NULL DEFAULT 'veg',
    is_bestseller     BOOLEAN NOT NULL DEFAULT FALSE,
    status            menu_item_status NOT NULL DEFAULT 'available',
    sort_order        SMALLINT NOT NULL DEFAULT 0,
    calories          SMALLINT,
    prep_time_min     SMALLINT,
    customizations    JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant ON menu_items (restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items (category_id);
CREATE INDEX idx_menu_items_status ON menu_items (status) WHERE status = 'available';

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE addresses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           address_type NOT NULL DEFAULT 'home',
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    address_line1   VARCHAR(255) NOT NULL,
    address_line2   VARCHAR(255),
    landmark        VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pincode         VARCHAR(10) NOT NULL,
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses (user_id);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE SEQUENCE order_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE orders (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number                VARCHAR(20) NOT NULL UNIQUE,
    customer_id                 UUID NOT NULL REFERENCES users(id),
    restaurant_id               UUID NOT NULL REFERENCES restaurants(id),
    delivery_address_id         UUID REFERENCES addresses(id),
    delivery_address_snapshot   JSONB NOT NULL,
    status                      order_status NOT NULL DEFAULT 'pending',
    subtotal                    INTEGER NOT NULL,
    delivery_fee                INTEGER NOT NULL DEFAULT 0,
    packaging_fee               INTEGER NOT NULL DEFAULT 0,
    platform_fee                INTEGER NOT NULL DEFAULT 0,
    tax_amount                  INTEGER NOT NULL DEFAULT 0,
    discount_amount             INTEGER NOT NULL DEFAULT 0,
    total_amount                INTEGER NOT NULL,
    coupon_code                 VARCHAR(30),
    coupon_discount             INTEGER NOT NULL DEFAULT 0,
    cooking_instructions        TEXT,
    delivery_instructions       TEXT,
    confirmed_at                TIMESTAMPTZ,
    vendor_accepted_at          TIMESTAMPTZ,
    preparing_at                TIMESTAMPTZ,
    ready_at                    TIMESTAMPTZ,
    picked_up_at                TIMESTAMPTZ,
    delivered_at                TIMESTAMPTZ,
    cancelled_at                TIMESTAMPTZ,
    cancellation_reason         TEXT,
    cancelled_by                UUID REFERENCES users(id),
    idempotency_key             VARCHAR(64) UNIQUE,
    estimated_prep_time_min     SMALLINT,
    estimated_delivery_min      SMALLINT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders (customer_id, created_at DESC);
CREATE INDEX idx_orders_restaurant ON orders (restaurant_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_order_number ON orders (order_number);
CREATE INDEX idx_orders_created ON orders (created_at DESC);

-- Auto-generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'TSSA' || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id          UUID NOT NULL REFERENCES menu_items(id),
    quantity              SMALLINT NOT NULL CHECK (quantity > 0),
    unit_price            INTEGER NOT NULL,
    total_price           INTEGER NOT NULL,
    customizations        JSONB,
    special_instructions  TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- ============================================================
-- ORDER STATUS LOGS
-- ============================================================
CREATE TABLE order_status_logs (
    id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status     order_status,
    to_status       order_status NOT NULL,
    changed_by      UUID REFERENCES users(id),
    change_source   VARCHAR(30) NOT NULL DEFAULT 'system',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_logs_order ON order_status_logs (order_id, created_at);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID NOT NULL REFERENCES orders(id),
    user_id                 UUID NOT NULL REFERENCES users(id),
    razorpay_order_id       VARCHAR(50),
    razorpay_payment_id     VARCHAR(50),
    razorpay_signature      VARCHAR(128),
    amount                  INTEGER NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'INR',
    method                  payment_method,
    status                  payment_status NOT NULL DEFAULT 'pending',
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at             TIMESTAMPTZ,
    verification_method     VARCHAR(20),
    refund_amount           INTEGER DEFAULT 0,
    refund_id               VARCHAR(50),
    refund_status           VARCHAR(20),
    refunded_at             TIMESTAMPTZ,
    refund_reason           TEXT,
    failure_reason          TEXT,
    failure_code            VARCHAR(50),
    webhook_payload         JSONB,
    webhook_received_at     TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_payments_order ON payments (order_id);
CREATE INDEX idx_payments_razorpay_order ON payments (razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment ON payments (razorpay_payment_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_user ON payments (user_id, created_at DESC);

-- ============================================================
-- DELIVERY PARTNER PROFILES
-- ============================================================
CREATE TABLE delivery_partner_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth       DATE,
    gender              VARCHAR(10),
    vehicle_type        VARCHAR(20) NOT NULL,
    vehicle_number      VARCHAR(20),
    driving_license_no  VARCHAR(30),
    driving_license_url TEXT,
    aadhaar_number      VARCHAR(14),
    aadhaar_url         TEXT,
    pan_number          VARCHAR(12),
    bank_account_no     VARCHAR(20),
    bank_ifsc           VARCHAR(15),
    bank_name           VARCHAR(100),
    approval_status     approval_status NOT NULL DEFAULT 'pending',
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    is_available        BOOLEAN NOT NULL DEFAULT FALSE,
    current_latitude    DECIMAL(10, 7),
    current_longitude   DECIMAL(10, 7),
    last_location_at    TIMESTAMPTZ,
    rating_avg          DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    total_deliveries    INTEGER NOT NULL DEFAULT 0,
    total_earnings      BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dp_profiles_user ON delivery_partner_profiles (user_id);
CREATE INDEX idx_dp_profiles_approval ON delivery_partner_profiles (approval_status);
CREATE INDEX idx_dp_profiles_available ON delivery_partner_profiles (is_available) WHERE is_available = TRUE;

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE deliveries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES orders(id),
    partner_id          UUID REFERENCES delivery_partner_profiles(id),
    status              delivery_status NOT NULL DEFAULT 'pending_assignment',
    delivery_otp        VARCHAR(6),
    otp_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    otp_verified_at     TIMESTAMPTZ,
    pickup_latitude     DECIMAL(10, 7),
    pickup_longitude    DECIMAL(10, 7),
    pickup_address      TEXT,
    picked_up_at        TIMESTAMPTZ,
    dropoff_latitude    DECIMAL(10, 7),
    dropoff_longitude   DECIMAL(10, 7),
    dropoff_address     TEXT,
    delivered_at        TIMESTAMPTZ,
    distance_km         DECIMAL(6, 2),
    earning_amount      INTEGER DEFAULT 0,
    tip_amount          INTEGER DEFAULT 0,
    assigned_at         TIMESTAMPTZ,
    accepted_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    failure_reason      TEXT,
    failure_image_url   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_deliveries_order ON deliveries (order_id);
CREATE INDEX idx_deliveries_partner ON deliveries (partner_id, created_at DESC);
CREATE INDEX idx_deliveries_status ON deliveries (status);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id          UUID NOT NULL UNIQUE REFERENCES orders(id),
    customer_id       UUID NOT NULL REFERENCES users(id),
    restaurant_id     UUID NOT NULL REFERENCES restaurants(id),
    food_rating       SMALLINT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
    delivery_rating   SMALLINT CHECK (delivery_rating BETWEEN 1 AND 5),
    overall_rating    SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    review_text       TEXT,
    review_images     TEXT[],
    is_visible        BOOLEAN NOT NULL DEFAULT TRUE,
    is_flagged        BOOLEAN NOT NULL DEFAULT FALSE,
    flagged_reason    TEXT,
    vendor_reply      TEXT,
    vendor_replied_at TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_restaurant ON reviews (restaurant_id, created_at DESC);
CREATE INDEX idx_reviews_customer ON reviews (customer_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           VARCHAR(150) NOT NULL,
    body            TEXT NOT NULL,
    data            JSONB,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    fcm_message_id  VARCHAR(100),
    is_sent         BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ,
    send_error      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE is_read = FALSE;

-- ============================================================
-- DEVICE TOKENS
-- ============================================================
CREATE TABLE device_tokens (
    id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fcm_token       TEXT NOT NULL,
    device_type     VARCHAR(10) NOT NULL,
    device_model    VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, fcm_token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens (user_id) WHERE is_active = TRUE;

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE coupons (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(30) NOT NULL UNIQUE,
    description         TEXT,
    discount_type       VARCHAR(15) NOT NULL,
    discount_value      INTEGER NOT NULL,
    max_discount        INTEGER,
    min_order_amount    INTEGER NOT NULL DEFAULT 0,
    max_uses_total      INTEGER,
    max_uses_per_user   SMALLINT NOT NULL DEFAULT 1,
    current_uses        INTEGER NOT NULL DEFAULT 0,
    valid_from          TIMESTAMPTZ NOT NULL,
    valid_until         TIMESTAMPTZ NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    restaurant_id       UUID REFERENCES restaurants(id),
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons (code) WHERE is_active = TRUE;

-- ============================================================
-- COUPON USAGES
-- ============================================================
CREATE TABLE coupon_usages (
    id                  BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    coupon_id           UUID NOT NULL REFERENCES coupons(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    order_id            UUID NOT NULL REFERENCES orders(id),
    discount_applied    INTEGER NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(coupon_id, order_id)
);

CREATE INDEX idx_coupon_usages_user ON coupon_usages (user_id, coupon_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trigger_update_%I_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            t, t
        );
    END LOOP;
END;
$$;
