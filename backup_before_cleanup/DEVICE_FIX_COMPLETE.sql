-- ====================================================================
-- COMPLETE DEVICE TRACKING FIX
-- Run ALL of this in Supabase SQL Editor
-- ====================================================================

-- Step 1: Drop everything and start fresh
DROP TABLE IF EXISTS active_devices CASCADE;
DROP FUNCTION IF EXISTS register_device_session(text, text, text, text);

-- Step 2: Create the active_devices table
CREATE TABLE active_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_identifier TEXT NOT NULL,
    device_name TEXT,
    user_agent TEXT,
    ip_address TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(user_id, device_identifier)
);

-- Step 3: Add indexes
CREATE INDEX idx_active_devices_user_id ON active_devices(user_id);
CREATE INDEX idx_active_devices_last_active ON active_devices(last_active_at);
CREATE INDEX idx_active_devices_is_active ON active_devices(is_active);

-- Step 4: Enable Row Level Security
ALTER TABLE active_devices ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Allow users to see their own devices
CREATE POLICY "Users can view own devices"
ON active_devices FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own devices (through RPC function)
CREATE POLICY "Service role can manage devices"
ON active_devices FOR ALL
USING (true);

-- Step 6: Create the device registration function
CREATE OR REPLACE FUNCTION register_device_session(
    p_device_identifier TEXT,
    p_device_name TEXT,
    p_user_agent TEXT,
    p_ip_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_device_count INT;
    v_max_devices INT := 3;
    v_existing_device_id UUID;
    v_oldest_device_id UUID;
    v_oldest_device_name TEXT;
    v_action TEXT;
BEGIN
    -- Get the current user ID from auth context
    v_user_id := auth.uid();
    
    -- If no user is logged in, return error
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not authenticated'
        );
    END IF;

    RAISE NOTICE 'Device registration for user: %, device: %', v_user_id, p_device_identifier;

    -- Check if this device already exists for this user
    SELECT id INTO v_existing_device_id
    FROM active_devices
    WHERE user_id = v_user_id 
    AND device_identifier = p_device_identifier;

    -- If device exists, just update it
    IF v_existing_device_id IS NOT NULL THEN
        UPDATE active_devices
        SET 
            last_active_at = NOW(),
            is_active = true,
            device_name = COALESCE(p_device_name, device_name),
            user_agent = COALESCE(p_user_agent, user_agent),
            ip_address = COALESCE(p_ip_address, ip_address)
        WHERE id = v_existing_device_id;

        RAISE NOTICE 'Updated existing device: %', v_existing_device_id;

        RETURN json_build_object(
            'success', true,
            'action', 'updated',
            'message', 'Device session updated',
            'device_id', v_existing_device_id
        );
    END IF;

    -- Count active devices for this user
    SELECT COUNT(*) INTO v_device_count
    FROM active_devices
    WHERE user_id = v_user_id AND is_active = true;

    RAISE NOTICE 'Current active device count: %', v_device_count;

    -- If at or over device limit, kick out oldest device(s)
    IF v_device_count >= v_max_devices THEN
        -- Get the oldest device
        SELECT id, device_name INTO v_oldest_device_id, v_oldest_device_name
        FROM active_devices
        WHERE user_id = v_user_id AND is_active = true
        ORDER BY last_active_at ASC
        LIMIT 1;

        -- Deactivate the oldest device
        UPDATE active_devices
        SET is_active = false
        WHERE id = v_oldest_device_id;

        RAISE NOTICE 'Kicked oldest device: % (%)', v_oldest_device_id, v_oldest_device_name;

        -- If somehow there are MORE than 3, deactivate all but the 2 newest
        -- This handles edge cases where multiple devices registered simultaneously
        UPDATE active_devices
        SET is_active = false
        WHERE user_id = v_user_id 
        AND is_active = true
        AND id NOT IN (
            SELECT id FROM active_devices
            WHERE user_id = v_user_id AND is_active = true
            ORDER BY last_active_at DESC
            LIMIT 2  -- Keep 2 active, we'll add the new one to make 3
        );

        v_action := 'kicked_and_registered';
    ELSE
        v_action := 'registered';
    END IF;

    -- Register the new device
    INSERT INTO active_devices (
        user_id,
        device_identifier,
        device_name,
        user_agent,
        ip_address,
        last_active_at,
        registered_at,
        is_active
    ) VALUES (
        v_user_id,
        p_device_identifier,
        p_device_name,
        p_user_agent,
        p_ip_address,
        NOW(),
        NOW(),
        true
    );

    RAISE NOTICE 'Successfully registered new device';

    RETURN json_build_object(
        'success', true,
        'action', v_action,
        'message', CASE 
            WHEN v_action = 'kicked_and_registered' THEN 'New device registered, oldest device kicked'
            ELSE 'Device registered successfully'
        END,
        'kicked_device', v_oldest_device_name,
        'device_count', LEAST(v_device_count + 1, v_max_devices)
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in device registration: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'message', 'Error registering device: ' || SQLERRM
        );
END;
$$;

-- Step 7: Grant execute permissions
GRANT EXECUTE ON FUNCTION register_device_session(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION register_device_session(text, text, text, text) TO anon;

-- Step 8: Test the setup (OPTIONAL - comment out if you want)
-- This will show you if the function works
SELECT register_device_session(
    'test-device-' || gen_random_uuid()::text,
    'Test Device',
    'Mozilla/5.0 Test',
    '127.0.0.1'
);

-- Step 9: Verify the setup
SELECT 
    'Device tracking setup complete!' as status,
    COUNT(*) as total_devices,
    COUNT(DISTINCT user_id) as users_with_devices
FROM active_devices;

-- Step 10: Show current device registrations per user
SELECT 
    p.email,
    p.full_name,
    COUNT(ad.id) FILTER (WHERE ad.is_active = true) as active_devices,
    COUNT(ad.id) as total_devices,
    MAX(ad.last_active_at) as last_active
FROM profiles p
LEFT JOIN active_devices ad ON p.id = ad.user_id
GROUP BY p.id, p.email, p.full_name
ORDER BY active_devices DESC, p.email;
