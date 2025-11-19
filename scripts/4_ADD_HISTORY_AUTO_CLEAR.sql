-- ============================================================================
-- ADD HISTORY AUTO-CLEAR COLUMNS TO PROFILES TABLE
-- ============================================================================
-- ⚠️ NOTE: If you ran 1_COMPLETE_RESET_AND_SETUP.sql (v2.0+), these columns
-- are already included! Only run this script if you're upgrading an existing
-- database from an older version.
--
-- This script adds three new columns to the profiles table:
-- 1. history_auto_clear_days: Number of days between automatic history clears
-- 2. history_auto_clear_minutes: Number of minutes (for testing)
-- 3. last_history_clear: Timestamp of the last history clear
-- ============================================================================

-- Add history_auto_clear_days column (nullable - null means auto-clear is disabled)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS history_auto_clear_days INTEGER DEFAULT NULL;

-- Add history_auto_clear_minutes column (nullable - for testing, overrides days)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS history_auto_clear_minutes INTEGER DEFAULT NULL;

-- Add last_history_clear column (nullable - null means never cleared)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_history_clear TIMESTAMPTZ DEFAULT NULL;

-- Add comment to columns for documentation
COMMENT ON COLUMN public.profiles.history_auto_clear_days IS 
'Number of days between automatic history clears. NULL means auto-clear is disabled.';

COMMENT ON COLUMN public.profiles.history_auto_clear_minutes IS 
'Number of minutes between automatic history clears (for testing). Overrides days if set.';

COMMENT ON COLUMN public.profiles.last_history_clear IS 
'Timestamp of the last history clear. NULL means history has never been cleared.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify the columns were added successfully:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('history_auto_clear_days', 'last_history_clear');
-- ============================================================================
