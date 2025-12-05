-- ====================================================================
-- CLEANUP OVER-LIMIT DEVICES
-- Run this to fix users who already have more than 3 devices
-- ====================================================================

-- Step 1: Show users with over-limit devices
SELECT 
    p.email,
    p.full_name,
    COUNT(ad.id) FILTER (WHERE ad.is_active = true) as active_devices
FROM profiles p
LEFT JOIN active_devices ad ON p.id = ad.user_id
WHERE p.role = 'business_user'
GROUP BY p.id, p.email, p.full_name
HAVING COUNT(ad.id) FILTER (WHERE ad.is_active = true) > 3
ORDER BY active_devices DESC;

-- Step 2: For each user with > 3 devices, keep only the 3 most recent
-- This deactivates all old devices beyond the limit
WITH ranked_devices AS (
    SELECT 
        id,
        user_id,
        device_name,
        last_active_at,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY last_active_at DESC) as rank
    FROM active_devices
    WHERE is_active = true
)
UPDATE active_devices
SET is_active = false
WHERE id IN (
    SELECT id FROM ranked_devices WHERE rank > 3
);

-- Step 3: Verify - show device counts after cleanup
SELECT 
    p.email,
    p.full_name,
    COUNT(ad.id) FILTER (WHERE ad.is_active = true) as active_devices,
    COUNT(ad.id) FILTER (WHERE ad.is_active = false) as kicked_devices
FROM profiles p
LEFT JOIN active_devices ad ON p.id = ad.user_id
WHERE p.role = 'business_user'
GROUP BY p.id, p.email, p.full_name
ORDER BY active_devices DESC;

-- Step 4: Show which devices were kicked
SELECT 
    p.email,
    p.full_name,
    ad.device_name,
    ad.last_active_at,
    ad.is_active
FROM active_devices ad
JOIN profiles p ON ad.user_id = p.id
WHERE ad.is_active = false
ORDER BY ad.last_active_at DESC;
