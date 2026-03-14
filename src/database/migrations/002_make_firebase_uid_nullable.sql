-- ============================================================
-- Migration 002: Make firebase_uid nullable
-- Required for 2Factor OTP users who don't go through Firebase Auth.
-- ============================================================

ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;
