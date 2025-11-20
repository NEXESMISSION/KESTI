-- =====================================================
-- DEVICE LIMIT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE TABLES
-- =====================================================

-- Table: User Limits (Admin controls device limits per user)
CREATE TABLE IF NOT EXISTS public.user_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  max_devices integer DEFAULT 3 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: Active Devices (Tracks all active sessions)
CREATE TABLE IF NOT EXISTS public.active_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_identifier text NOT NULL,
  device_name text,
  user_agent text,
  ip_address text,
  last_active_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Prevent duplicate rows for the same device
  CONSTRAINT unique_device_per_user UNIQUE(user_id, device_identifier)
);

-- 2. CREATE INDEXES (Performance optimization)
-- =====================================================

-- Index for finding oldest device quickly
CREATE INDEX IF NOT EXISTS idx_active_devices_last_active 
ON public.active_devices (user_id, last_active_at ASC);

-- Index for device lookup
CREATE INDEX IF NOT EXISTS idx_active_devices_device_id 
ON public.active_devices (device_identifier);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_active_devices_user_id 
ON public.active_devices (user_id);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_devices ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
-- =====================================================

-- Users can view their own device list
DROP POLICY IF EXISTS "Users can view own devices" ON public.active_devices;
CREATE POLICY "Users can view own devices" 
ON public.active_devices FOR SELECT 
USING (auth.uid() = user_id);

-- Users can view their own device limit
DROP POLICY IF EXISTS "Users can view own limit" ON public.user_limits;
CREATE POLICY "Users can view own limit" 
ON public.user_limits FOR SELECT 
USING (auth.uid() = user_id);

-- Super admins can view all limits
DROP POLICY IF EXISTS "Super admins can manage all limits" ON public.user_limits;
CREATE POLICY "Super admins can manage all limits" 
ON public.user_limits FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Super admins can view all devices
DROP POLICY IF EXISTS "Super admins can view all devices" ON public.active_devices;
CREATE POLICY "Super admins can view all devices" 
ON public.active_devices FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- 5. TRIGGER: Auto-assign default limit on user creation
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_limit() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, max_devices)
  VALUES (new.id, 3)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_limit ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_limit
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_limit();

-- 6. MAIN FUNCTION: Register Device with Graceful Kick-Out
-- =====================================================

CREATE OR REPLACE FUNCTION public.register_device_session(
  p_device_identifier text,
  p_device_name text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_max_devices integer;
  v_current_count integer;
  v_kicked_device_name text;
BEGIN
  -- Get current User ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- 1. UPSERT: If this specific device is already registered, just update the timestamp
  IF EXISTS (
    SELECT 1 FROM active_devices 
    WHERE user_id = v_user_id 
    AND device_identifier = p_device_identifier
  ) THEN
    UPDATE active_devices 
    SET 
      last_active_at = now(), 
      device_name = COALESCE(p_device_name, device_name),
      user_agent = COALESCE(p_user_agent, user_agent),
      ip_address = COALESCE(p_ip_address, ip_address)
    WHERE user_id = v_user_id 
    AND device_identifier = p_device_identifier;
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'updated',
      'message', 'Device session updated'
    );
  END IF;

  -- 2. FETCH LIMIT: Get user's limit (default to 3 if missing)
  SELECT COALESCE(max_devices, 3) INTO v_max_devices 
  FROM user_limits 
  WHERE user_id = v_user_id;
  
  -- If no limit record exists, create one with default
  IF v_max_devices IS NULL THEN
    INSERT INTO user_limits (user_id, max_devices)
    VALUES (v_user_id, 3)
    ON CONFLICT (user_id) DO NOTHING;
    v_max_devices := 3;
  END IF;

  -- 3. COUNT ACTIVE: How many devices do they have now?
  SELECT count(*) INTO v_current_count 
  FROM active_devices 
  WHERE user_id = v_user_id;

  -- 4. ROTATION LOGIC: If limit reached, delete the OLDEST
  IF v_current_count >= v_max_devices THEN
    -- Get the name of the device being kicked out
    SELECT device_name INTO v_kicked_device_name
    FROM active_devices 
    WHERE user_id = v_user_id 
    ORDER BY last_active_at ASC 
    LIMIT 1;
    
    -- Delete the oldest device
    DELETE FROM active_devices
    WHERE id = (
      SELECT id FROM active_devices 
      WHERE user_id = v_user_id 
      ORDER BY last_active_at ASC
      LIMIT 1
    );
    
    -- 5. INSERT: Register the new device
    INSERT INTO active_devices (
      user_id, 
      device_identifier, 
      device_name,
      user_agent,
      ip_address
    )
    VALUES (
      v_user_id, 
      p_device_identifier, 
      p_device_name,
      p_user_agent,
      p_ip_address
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'kicked_and_registered',
      'message', 'Device registered, oldest device kicked out',
      'kicked_device', v_kicked_device_name,
      'limit', v_max_devices
    );
  ELSE
    -- 5. INSERT: Register the new device (space available)
    INSERT INTO active_devices (
      user_id, 
      device_identifier, 
      device_name,
      user_agent,
      ip_address
    )
    VALUES (
      v_user_id, 
      p_device_identifier, 
      p_device_name,
      p_user_agent,
      p_ip_address
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'registered',
      'message', 'Device registered successfully',
      'devices_used', v_current_count + 1,
      'limit', v_max_devices
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. HELPER FUNCTION: Remove a specific device
-- =====================================================

CREATE OR REPLACE FUNCTION public.remove_device(
  p_device_id uuid
) RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  DELETE FROM active_devices
  WHERE id = p_device_id
  AND user_id = v_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ADMIN FUNCTION: Update user device limit
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_user_device_limit(
  p_user_id uuid,
  p_max_devices integer
) RETURNS boolean AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_admin_id 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can update device limits';
  END IF;
  
  -- Validate limit
  IF p_max_devices < 1 OR p_max_devices > 10 THEN
    RAISE EXCEPTION 'Device limit must be between 1 and 10';
  END IF;
  
  -- Upsert the limit
  INSERT INTO user_limits (user_id, max_devices, updated_at)
  VALUES (p_user_id, p_max_devices, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET max_devices = p_max_devices, updated_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ADMIN FUNCTION: Get all devices for a user (for admin dashboard)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_devices(
  p_user_id uuid
) RETURNS TABLE (
  id uuid,
  device_identifier text,
  device_name text,
  user_agent text,
  ip_address text,
  last_active_at timestamp with time zone,
  created_at timestamp with time zone
) AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  
  -- Check if caller is super admin or the user themselves
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = v_admin_id 
    AND (profiles.role = 'super_admin' OR profiles.id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    ad.id,
    ad.device_identifier,
    ad.device_name,
    ad.user_agent,
    ad.ip_address,
    ad.last_active_at,
    ad.created_at
  FROM active_devices ad
  WHERE ad.user_id = p_user_id
  ORDER BY ad.last_active_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ADMIN FUNCTION: Revoke specific device (force logout)
-- =====================================================

CREATE OR REPLACE FUNCTION public.revoke_device(
  p_device_id uuid
) RETURNS boolean AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  v_admin_id := auth.uid();
  
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_admin_id 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can revoke devices';
  END IF;
  
  DELETE FROM active_devices
  WHERE id = p_device_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Now run the following in your application:
-- 1. Create deviceManager utility (see deviceManager.ts)
-- 2. Call registerCurrentDevice() after login
-- 3. Call enforceDeviceLimit() in _app.tsx
-- 4. Add device management UI to super-admin dashboard
-- =====================================================
