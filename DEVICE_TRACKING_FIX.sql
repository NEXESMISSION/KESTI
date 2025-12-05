-- Device Tracking Fix
-- Run this in Supabase SQL Editor to fix device tracking

-- 1. First, verify active_devices table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'active_devices'
);

-- 2. If the table doesn't exist, create it
CREATE TABLE IF NOT EXISTS active_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_identifier TEXT NOT NULL,
    device_name TEXT,
    user_agent TEXT,
    ip_address TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, device_identifier)
);

-- 3. Add is_active column if it doesn't exist (in case table was created before)
ALTER TABLE active_devices 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. Set is_active to true for all existing devices
UPDATE active_devices 
SET is_active = true 
WHERE is_active IS NULL;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_devices_user_id ON active_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_active_devices_last_active ON active_devices(last_active_at);
CREATE INDEX IF NOT EXISTS idx_active_devices_is_active ON active_devices(is_active);

-- 4. Drop existing function if it exists (to recreate it properly)
DROP FUNCTION IF EXISTS register_device_session(text, text, text, text);

-- 5. Create or replace the device registration function
CREATE OR REPLACE FUNCTION register_device_session(
    p_device_identifier TEXT,
    p_device_name TEXT,
    p_user_agent TEXT,
    p_ip_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not authenticated'
        );
    END IF;

    -- Log the attempt
    RAISE NOTICE 'Device registration attempt for user: %, device: %', v_user_id, p_device_identifier;

    -- Check if this device is already registered for this user
    SELECT id INTO v_existing_device_id
    FROM active_devices
    WHERE user_id = v_user_id 
    AND device_identifier = p_device_identifier;

    IF v_existing_device_id IS NOT NULL THEN
        -- Device exists, update last_active_at
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

    RAISE NOTICE 'Current device count: %', v_device_count;

    IF v_device_count >= v_max_devices THEN
        -- Find the oldest device to kick out
        SELECT id, device_name INTO v_oldest_device_id, v_oldest_device_name
        FROM active_devices
        WHERE user_id = v_user_id AND is_active = true
        ORDER BY last_active_at ASC
        LIMIT 1;

        -- Deactivate the oldest device
        UPDATE active_devices
        SET is_active = false
        WHERE id = v_oldest_device_id;

        RAISE NOTICE 'Kicked oldest device: %', v_oldest_device_id;

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

    RAISE NOTICE 'Registered new device successfully';

    RETURN json_build_object(
        'success', true,
        'action', v_action,
        'message', CASE 
            WHEN v_action = 'kicked_and_registered' THEN 'New device registered, oldest device kicked'
            ELSE 'Device registered successfully'
        END,
        'kicked_device', v_oldest_device_name,
        'device_count', v_device_count + 1
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

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION register_device_session(text, text, text, text) TO authenticated;

-- 7. Test the function (this will register a test device for the current user if run as authenticated user)
-- SELECT * FROM register_device_session('test-device-123', 'Test Device', 'Test User Agent', '127.0.0.1');

-- 8. Verify the setup
SELECT 
    'Setup complete!' as status,
    COUNT(*) as total_devices,
    COUNT(DISTINCT user_id) as users_with_devices
FROM active_devices;

-- 9. Show current device registrations
SELECT 
    u.email,
    COUNT(ad.id) as device_count,
    MAX(ad.last_active_at) as last_active
FROM auth.users u
LEFT JOIN active_devices ad ON u.id = ad.user_id AND ad.is_active = true
GROUP BY u.email
ORDER BY device_count DESC, u.email;
