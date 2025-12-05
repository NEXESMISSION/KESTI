-- Fix profiles table to track completion properly
-- Run this in Supabase SQL Editor

-- 1. Add profile_completed column to track if user finished setup
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- 2. Add subscription_status column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- 3. Update existing profiles that have all required fields as completed
UPDATE profiles 
SET profile_completed = true 
WHERE full_name IS NOT NULL 
  AND phone_number IS NOT NULL 
  AND pin_code IS NOT NULL;

-- 4. Set subscription_status to 'trial' for users who don't have it
UPDATE profiles 
SET subscription_status = 'trial'
WHERE subscription_status IS NULL;

-- 5. Ensure subscription_ends_at is set for all trial users
-- Fix any existing users who don't have trial end date (set to 15 days from creation)
UPDATE profiles 
SET subscription_ends_at = (created_at + INTERVAL '15 days')
WHERE subscription_ends_at IS NULL;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_completed ON profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- 5. Verify the changes
SELECT 
    id,
    email,
    full_name,
    role,
    subscription_status,
    subscription_ends_at,
    profile_completed,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
