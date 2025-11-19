-- ============================================================================
-- DELETE USER BY EMAIL
-- ============================================================================
-- This script will delete a user from both auth.users and public.profiles
-- Use this when you want to remove a user and recreate them
-- ============================================================================

-- STEP 1: Check if the user exists
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.full_name,
  p.role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'quikasalami@gmail.com';

-- STEP 2: Delete the user (uncomment the line below after verifying above)
-- DELETE FROM auth.users WHERE email = 'quikasalami@gmail.com';

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. First run the SELECT query above to verify the user exists
-- 2. If you want to delete them, uncomment the DELETE line (remove the --)
-- 3. Run the DELETE query
-- 4. The user will be removed from both auth.users and profiles (CASCADE)
-- ============================================================================

-- ALTERNATIVE: View ALL users
-- SELECT 
--   au.id,
--   au.email,
--   au.created_at,
--   p.full_name,
--   p.role
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON p.id = au.id
-- ORDER BY au.created_at DESC;
