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

-- Step 3: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_auto_set_business_id_products ON products;
DROP TRIGGER IF EXISTS trigger_auto_set_business_id_categories ON categories;
DROP TRIGGER IF EXISTS trigger_auto_set_business_id_expenses ON expenses;
DROP TRIGGER IF EXISTS trigger_auto_set_business_id_sales ON sales;

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
GRANT EXECUTE ON FUNCTION update_business_settings(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_details() TO authenticated;

-- Verification queries (run these to check if everything is set up correctly)
-- SELECT * FROM businesses LIMIT 5;
-- SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name LIKE '%business_id%';

-- Migration Complete!
-- Summary:
-- 1. Added phone number fields (primary, secondary, tertiary) to businesses table
-- 2. Created auto_set_business_id() trigger function to automatically populate business_id
-- 3. Added triggers to products, categories, expenses, and sales tables
-- 4. Updated update_business_settings() to handle phone numbers
-- 5. Updated get_business_details() to return phone numbers
