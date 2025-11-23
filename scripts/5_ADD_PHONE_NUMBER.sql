-- ================================================
-- ADD PHONE NUMBER TO PROFILES TABLE
-- ================================================
-- This script adds phone_number column to the profiles table
-- Run this if you already have an existing database
-- ================================================

-- Add phone_number column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.phone_number IS 'User phone number for contact';

-- Create index for phone number lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Phone number column added successfully to profiles table';
  RAISE NOTICE '📋 You can now use phone_number field in signup and profile management';
END $$;
