-- ===================================================================
-- DIAGNOSTIC SCRIPT - Find What's Wrong With Analytics
-- ===================================================================
-- Run this in Supabase SQL Editor to diagnose the issue
-- ===================================================================

-- TEST 1: Check if tables exist
SELECT 'TEST 1: Tables Check' as test;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'credit_sales', 'products', 'credit_customers', 'expenses', 'active_devices')
ORDER BY table_name;

-- TEST 2: Check if function exists
SELECT 'TEST 2: Function Check' as test;
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_all_users_analytics';

-- TEST 3: Check credit_sales structure
SELECT 'TEST 3: credit_sales Columns' as test;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'credit_sales'
ORDER BY ordinal_position;

-- TEST 4: Check if there are business users
SELECT 'TEST 4: Business Users Count' as test;
SELECT 
    COUNT(*) as total_business_users,
    COUNT(*) FILTER (WHERE subscription_ends_at > NOW()) as active_subscriptions,
    COUNT(*) FILTER (WHERE is_suspended = true) as suspended_users
FROM profiles
WHERE role = 'business_user';

-- TEST 5: Check if there are sales records
SELECT 'TEST 5: Sales Records' as test;
SELECT 
    COUNT(*) as total_sales,
    COUNT(DISTINCT owner_id) as unique_owners,
    SUM(total_amount) as total_revenue,
    MAX(created_at) as most_recent_sale
FROM credit_sales;

-- TEST 6: Try to run the function (this is where it might fail)
SELECT 'TEST 6: Running Function' as test;
SELECT get_all_users_analytics(30);

-- If TEST 6 fails, the error message will show exactly what's wrong!

-- ===================================================================
-- RESULTS INTERPRETATION:
-- ===================================================================
-- ✅ TEST 1: Should show 6 tables (or at least profiles, credit_sales, products)
-- ✅ TEST 2: Should show get_all_users_analytics function
-- ✅ TEST 3: Should show columns like: owner_id, total_amount, payment_method
-- ✅ TEST 4: Should show at least 1 business user
-- ✅ TEST 5: Should show some sales data
-- ✅ TEST 6: Should return JSON with user analytics
--
-- If any test fails, that's where the problem is!
-- ===================================================================
