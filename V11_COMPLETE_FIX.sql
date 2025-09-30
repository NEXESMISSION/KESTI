-- V11 Complete Fix Migration
-- Fixes: business_id auto-population, phone numbers for businesses
-- Run this with: psql -U postgres -d your_database -f V11_COMPLETE_FIX.sql
-- Or paste into Supabase SQL Editor

-- Step 1: Add phone number fields to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS phone_primary VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_tertiary VARCHAR(20);

-- Step 2: Create trigger functions to auto-populate business_id
-- This function automatically sets business_id based on the authenticated user's profile

CREATE OR REPLACE FUNCTION auto_set_business_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the business_id from the user's profile
  SELECT business_id INTO NEW.business_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- If business_id is still null, raise an error
  IF NEW.business_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine business_id for user %', auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-populate sold_by_user_id for sales
CREATE OR REPLACE FUNCTION auto_set_sold_by_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set sold_by_user_id to the currently authenticated user
  NEW.sold_by_user_id := auth.uid();
  
  -- If still null, raise an error
  IF NEW.sold_by_user_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine user ID for sale';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_auto_set_business_id_products ON products;
DROP TRIGGER IF EXISTS trigger_auto_set_business_id_categories ON categories;
DROP TRIGGER IF EXISTS trigger_auto_set_business_id_expenses ON expenses;
DROP TRIGGER IF EXISTS trigger_auto_set_business_id_sales ON sales;
DROP TRIGGER IF EXISTS trigger_auto_set_sold_by_user_id_sales ON sales;

-- Step 4: Create triggers for all tables that need business_id
CREATE TRIGGER trigger_auto_set_business_id_products
  BEFORE INSERT ON products
  FOR EACH ROW
  WHEN (NEW.business_id IS NULL)
  EXECUTE FUNCTION auto_set_business_id();

CREATE TRIGGER trigger_auto_set_business_id_categories
  BEFORE INSERT ON categories
  FOR EACH ROW
  WHEN (NEW.business_id IS NULL)
  EXECUTE FUNCTION auto_set_business_id();

CREATE TRIGGER trigger_auto_set_business_id_expenses
  BEFORE INSERT ON expenses
  FOR EACH ROW
  WHEN (NEW.business_id IS NULL)
  EXECUTE FUNCTION auto_set_business_id();

CREATE TRIGGER trigger_auto_set_business_id_sales
  BEFORE INSERT ON sales
  FOR EACH ROW
  WHEN (NEW.business_id IS NULL)
  EXECUTE FUNCTION auto_set_business_id();

CREATE TRIGGER trigger_auto_set_sold_by_user_id_sales
  BEFORE INSERT ON sales
  FOR EACH ROW
  WHEN (NEW.sold_by_user_id IS NULL)
  EXECUTE FUNCTION auto_set_sold_by_user_id();

-- Step 5: Update the update_business_settings function to handle phone numbers
CREATE OR REPLACE FUNCTION update_business_settings(
  p_business_name TEXT DEFAULT NULL,
  p_pin_code TEXT DEFAULT NULL,
  p_phone_primary TEXT DEFAULT NULL,
  p_phone_secondary TEXT DEFAULT NULL,
  p_phone_tertiary TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_business_id UUID;
  v_update_count INT := 0;
BEGIN
  -- Get the business_id for the current user
  SELECT business_id INTO v_business_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_business_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No business associated with this user'
    );
  END IF;

  -- Update business settings
  UPDATE businesses
  SET 
    name = COALESCE(p_business_name, name),
    pin_code = COALESCE(p_pin_code, pin_code),
    phone_primary = COALESCE(p_phone_primary, phone_primary),
    phone_secondary = COALESCE(p_phone_secondary, phone_secondary),
    phone_tertiary = COALESCE(p_phone_tertiary, phone_tertiary),
    updated_at = NOW()
  WHERE id = v_business_id;

  GET DIAGNOSTICS v_update_count = ROW_COUNT;

  IF v_update_count > 0 THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Business settings updated successfully'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'No changes were made'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update get_business_details to include phone numbers
CREATE OR REPLACE FUNCTION get_business_details()
RETURNS TABLE (
  id UUID,
  name TEXT,
  subscription_end_date DATE,
  device_limit INTEGER,
  currency TEXT,
  status TEXT,
  pin_code TEXT,
  phone_primary TEXT,
  phone_secondary TEXT,
  phone_tertiary TEXT,
  active_devices BIGINT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Get the business_id for the current user
  SELECT business_id INTO v_business_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'No business associated with this user';
  END IF;

  -- Return business details with active device count
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.subscription_end_date,
    b.device_limit,
    b.currency,
    b.status,
    b.pin_code,
    b.phone_primary,
    b.phone_secondary,
    b.phone_tertiary,
    (SELECT COUNT(*) 
     FROM device_sessions 
     WHERE business_id = b.id 
     AND last_active > NOW() - INTERVAL '24 hours') AS active_devices,
    b.created_at
  FROM businesses b
  WHERE b.id = v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_set_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_set_sold_by_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION update_business_settings(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_details() TO authenticated;

-- Step 8: Enhanced device session management with automatic limit enforcement

-- Update register_device_session to enforce device limits automatically
CREATE OR REPLACE FUNCTION register_device_session(
  p_device_id TEXT,
  p_device_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_business_id UUID;
  v_device_limit INT;
  v_current_count INT;
  v_oldest_session_id UUID;
BEGIN
  -- Get business_id and device_limit for current user
  SELECT p.business_id, b.device_limit
  INTO v_business_id, v_device_limit
  FROM profiles p
  JOIN businesses b ON b.id = p.business_id
  WHERE p.id = auth.uid();

  IF v_business_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No business associated with this user'
    );
  END IF;

  -- Count current active sessions (last 5 minutes)
  SELECT COUNT(*)
  INTO v_current_count
  FROM device_sessions
  WHERE business_id = v_business_id
    AND last_active > NOW() - INTERVAL '5 minutes';

  -- If limit is reached, remove the oldest session
  IF v_current_count >= v_device_limit THEN
    -- Get the oldest session ID
    SELECT id INTO v_oldest_session_id
    FROM device_sessions
    WHERE business_id = v_business_id
      AND last_active > NOW() - INTERVAL '5 minutes'
    ORDER BY last_active ASC
    LIMIT 1;

    -- Delete the oldest session
    DELETE FROM device_sessions WHERE id = v_oldest_session_id;
  END IF;

  -- Insert or update this device's session
  INSERT INTO device_sessions (business_id, device_id, device_name, last_active)
  VALUES (v_business_id, p_device_id, p_device_name, NOW())
  ON CONFLICT (business_id, device_id)
  DO UPDATE SET
    last_active = NOW(),
    device_name = COALESCE(EXCLUDED.device_name, device_sessions.device_name);

  RETURN json_build_object(
    'success', true,
    'message', 'Device session registered successfully',
    'device_id', p_device_id,
    'business_id', v_business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current session is still valid
CREATE OR REPLACE FUNCTION check_device_session(p_device_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_business_id UUID;
  v_session_exists BOOLEAN;
BEGIN
  -- Get business_id for current user
  SELECT business_id INTO v_business_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_business_id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'No business associated with this user'
    );
  END IF;

  -- Check if session exists and is recent
  SELECT EXISTS(
    SELECT 1
    FROM device_sessions
    WHERE business_id = v_business_id
      AND device_id = p_device_id
      AND last_active > NOW() - INTERVAL '5 minutes'
  ) INTO v_session_exists;

  RETURN json_build_object(
    'valid', v_session_exists,
    'message', CASE 
      WHEN v_session_exists THEN 'Session is valid'
      ELSE 'Session expired or removed due to device limit'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity (heartbeat)
CREATE OR REPLACE FUNCTION update_device_session(p_device_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_business_id UUID;
  v_updated BOOLEAN := false;
BEGIN
  -- Get business_id for current user
  SELECT business_id INTO v_business_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_business_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No business associated with this user'
    );
  END IF;

  -- Update last_active timestamp
  UPDATE device_sessions
  SET last_active = NOW()
  WHERE business_id = v_business_id
    AND device_id = p_device_id
  RETURNING true INTO v_updated;

  IF v_updated THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Session updated'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Session not found - please login again'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION register_device_session(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_device_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_device_session(TEXT) TO authenticated;

-- Verification queries (run these to check if everything is set up correctly)
-- SELECT * FROM businesses LIMIT 5;
-- SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name LIKE '%business_id%';
-- SELECT * FROM device_sessions ORDER BY last_active DESC LIMIT 10;

-- Step 9: Storage Bucket Setup (MUST BE DONE MANUALLY IN SUPABASE DASHBOARD)
-- Go to Storage → Create a new bucket named 'product_images'
-- Set it to PUBLIC
-- Add the following policies:

-- IMPORTANT: After running this SQL, go to Supabase Dashboard → Storage
-- 1. Create a new bucket called 'product_images'
-- 2. Set it to PUBLIC access
-- 3. Add these policies in the Storage Policies section:

/*
Policy Name: Allow authenticated users to upload
Allowed operation: INSERT
Policy definition:
(bucket_id = 'product_images'::text) AND (auth.role() = 'authenticated'::text)

Policy Name: Public read access  
Allowed operation: SELECT
Policy definition:
(bucket_id = 'product_images'::text)

Policy Name: Allow authenticated users to update
Allowed operation: UPDATE
Policy definition:
(bucket_id = 'product_images'::text) AND (auth.role() = 'authenticated'::text)

Policy Name: Allow authenticated users to delete
Allowed operation: DELETE
Policy definition:
(bucket_id = 'product_images'::text) AND (auth.role() = 'authenticated'::text)
*/

-- Migration Complete!
-- Summary:
-- 1. Added phone number fields (primary, secondary, tertiary) to businesses table
-- 2. Created auto_set_business_id() trigger function to automatically populate business_id
-- 3. Created auto_set_sold_by_user_id() trigger function to automatically populate sold_by_user_id
-- 4. Added triggers to products, categories, expenses, and sales tables
-- 5. Added sold_by_user_id trigger to sales table (fixes "sold_by_user_id null" error)
-- 6. Updated update_business_settings() to handle phone numbers
-- 7. Updated get_business_details() to return phone numbers
-- 8. Enhanced device session management with automatic enforcement:
--    - register_device_session: Automatically removes oldest session when limit reached
--    - check_device_session: Validates if current session is still active
--    - update_device_session: Heartbeat to keep session alive
-- 9. Device sessions expire after 5 minutes of inactivity
-- 10. Storage bucket 'product_images' must be created manually (see instructions above)
