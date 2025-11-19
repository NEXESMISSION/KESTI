-- ============================================================================
-- Create First Super Admin User
-- ============================================================================
-- Run this AFTER you've created a user in Supabase Auth UI
-- This will upgrade that user to super_admin with proper settings
-- ============================================================================

-- INSTRUCTIONS:
-- 1. First, create a user in Supabase Dashboard:
--    - Go to Authentication > Users
--    - Click "Add user" > "Create new user"  
--    - Enter email and password
--    - Check "Auto Confirm User"
--    - Click "Create user"
--
-- 2. Then edit the values below and run this script

-- ============================================================================
-- CONFIGURE YOUR SUPER ADMIN DETAILS HERE
-- ============================================================================

DO $$ 
DECLARE
  -- ✅ CONFIGURED FOR: quikasalami@gmail.com
  admin_email TEXT := 'quikasalami@gmail.com';       -- Your admin email
  admin_name TEXT := 'Super Administrator';          -- Your name
  admin_pin TEXT := '123456';                        -- 4-6 digit PIN
  subscription_years INTEGER := 10;                  -- How many years of subscription
  
  -- Don't edit below this line
  user_id UUID;
BEGIN
  -- Find the user ID from auth.users
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users. Please create the user first in Supabase Auth UI.', admin_email;
  END IF;
  
  -- Update or insert profile
  INSERT INTO public.profiles (
    id,
    email,
    role,
    full_name,
    pin_code,
    subscription_ends_at,
    is_suspended,
    created_at
  ) VALUES (
    user_id,
    admin_email,
    'super_admin'::user_role,
    admin_name,
    admin_pin,
    NOW() + (subscription_years || ' years')::INTERVAL,
    false,
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    role = 'super_admin'::user_role,
    full_name = admin_name,
    pin_code = admin_pin,
    subscription_ends_at = NOW() + (subscription_years || ' years')::INTERVAL,
    is_suspended = false;
  
  RAISE NOTICE '✅ Super admin created successfully!';
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Name: %', admin_name;
  RAISE NOTICE 'PIN: %', admin_pin;
  RAISE NOTICE 'Subscription valid until: %', (NOW() + (subscription_years || ' years')::INTERVAL);
  
END $$;

-- Verify the super admin was created
SELECT 
  '✅ SUPER ADMIN VERIFIED' as status,
  email,
  full_name,
  role,
  pin_code,
  CASE 
    WHEN subscription_ends_at > NOW() THEN 
      EXTRACT(DAY FROM (subscription_ends_at - NOW()))::INTEGER || ' days'
    ELSE 'EXPIRED' 
  END as subscription_remaining,
  is_suspended
FROM public.profiles
WHERE role = 'super_admin'
ORDER BY created_at DESC;

-- Show all profiles (for verification)
SELECT 
  email,
  role,
  full_name,
  is_suspended
FROM public.profiles
ORDER BY created_at DESC;

-- Success message
SELECT '
🎉 SUCCESS!
===========

Your super admin account is ready!

Login Details:
--------------
Go to: http://localhost:3000/super-admin
Email: (the email you configured)
Password: (the password you set in Supabase Auth)
PIN: (the PIN you configured in this script)

Next Steps:
-----------
1. Start your dev server: npm run dev
2. Go to http://localhost:3000/super-admin
3. Login with your credentials
4. Start creating business accounts!

' as instructions;
