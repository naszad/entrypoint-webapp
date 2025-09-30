-- Migration: Add additional fields to students table
-- Date: 2025-09-21
-- Ticket: DEV-181 (Additional Student Fields)

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS lunch_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS state_student_number VARCHAR(128),
  ADD COLUMN IF NOT EXISTS race VARCHAR(128),

  ADD COLUMN IF NOT EXISTS address_physical_street TEXT,
  ADD COLUMN IF NOT EXISTS address_physical_city TEXT,
  ADD COLUMN IF NOT EXISTS address_physical_state TEXT,
  ADD COLUMN IF NOT EXISTS address_physical_postal_code VARCHAR(32),

  ADD COLUMN IF NOT EXISTS address_mailing_street TEXT,
  ADD COLUMN IF NOT EXISTS address_mailing_city TEXT,
  ADD COLUMN IF NOT EXISTS address_mailing_state TEXT,
  ADD COLUMN IF NOT EXISTS address_mailing_postal_code VARCHAR(32),

  ADD COLUMN IF NOT EXISTS student_number VARCHAR(128),
  ADD COLUMN IF NOT EXISTS locker_number VARCHAR(128),
  ADD COLUMN IF NOT EXISTS locker_combination VARCHAR(128);
