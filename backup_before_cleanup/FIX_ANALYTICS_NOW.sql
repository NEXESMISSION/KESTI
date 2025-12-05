-- ===================================================================
-- ANALYTICS FIX - RUN THIS IN SUPABASE SQL EDITOR
-- ===================================================================
-- This will fix the "User Analytics not set up" error
-- ===================================================================

-- Step 1: Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_all_users_analytics(INTEGER);
DROP FUNCTION IF EXISTS get_user_analytics(UUID, INTEGER);

-- Step 2: Create SIMPLIFIED get_all_users_analytics function
-- Fixed: Uses owner_id for business tables, user_id for system tables
CREATE OR REPLACE FUNCTION get_all_users_analytics(p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(user_data ORDER BY user_data->>'created_at' DESC)
    INTO v_result
    FROM (
        SELECT json_build_object(
            'user_id', p.id,
            'email', p.email,
            'full_name', p.full_name,
            'role', p.role,
            'total_sales', COALESCE(
                (SELECT SUM(total_amount) 
                 FROM credit_sales 
                 WHERE owner_id = p.id 
                 AND created_at >= NOW() - (p_days || ' days')::INTERVAL), 
                0
            ),
            'total_transactions', COALESCE(
                (SELECT COUNT(*) 
                 FROM credit_sales 
                 WHERE owner_id = p.id 
                 AND created_at >= NOW() - (p_days || ' days')::INTERVAL),
                0
            ),
            'total_products', COALESCE(
                (SELECT COUNT(*) 
                 FROM products 
                 WHERE owner_id = p.id),
                0
            ),
            'total_customers', COALESCE(
                (SELECT COUNT(*) 
                 FROM credit_customers 
                 WHERE owner_id = p.id),
                0
            ),
            'outstanding_credit', COALESCE(
                (SELECT SUM(remaining_amount) 
                 FROM credit_sales 
                 WHERE owner_id = p.id 
                 AND is_paid = false),
                0
            ),
            'total_expenses', COALESCE(
                (SELECT SUM(amount)
                 FROM expenses
                 WHERE owner_id = p.id
                 AND created_at >= NOW() - (p_days || ' days')::INTERVAL),
                0
            ),
            'total_logins', COALESCE(
                (SELECT COUNT(*) 
                 FROM user_activity_log 
                 WHERE user_id = p.id 
                 AND activity_type = 'login' 
                 AND created_at >= NOW() - (p_days || ' days')::INTERVAL),
                0
            ),
            'last_login', (
                SELECT MAX(created_at) 
                FROM user_activity_log 
                WHERE user_id = p.id 
                AND activity_type = 'login'
            ),
            'active_devices', COALESCE(
                (SELECT COUNT(*) 
                 FROM active_devices 
                 WHERE user_id = p.id 
                 AND is_active = true),
                0
            ),
            'subscription_status', CASE
                WHEN p.subscription_ends_at IS NULL THEN 'no_subscription'
                WHEN p.subscription_ends_at < NOW() THEN 'expired'
                WHEN p.subscription_ends_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
                ELSE 'active'
            END,
            'subscription_ends_at', p.subscription_ends_at,
            'is_suspended', p.is_suspended,
            'created_at', p.created_at
        ) AS user_data
        FROM profiles p
        WHERE p.role = 'business_user'
    ) sub;

    RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

-- Step 3: Create get_user_analytics function (for individual users)
CREATE OR REPLACE FUNCTION get_user_analytics(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'user_info', json_build_object(
            'user_id', p.id,
            'email', p.email,
            'full_name', p.full_name,
            'role', p.role,
            'created_at', p.created_at,
            'subscription_ends_at', p.subscription_ends_at,
            'is_suspended', p.is_suspended
        ),
        'sales_metrics', (
            SELECT json_build_object(
                'total_sales', COALESCE(SUM(total_amount), 0),
                'total_transactions', COUNT(*),
                'avg_transaction_value', COALESCE(AVG(total_amount), 0),
                'cash_sales', COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0),
                'credit_sales', COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total_amount ELSE 0 END), 0),
                'last_sale_date', MAX(created_at)
            )
            FROM credit_sales
            WHERE owner_id = p_user_id
            AND created_at >= NOW() - (p_days || ' days')::INTERVAL
        ),
        'product_metrics', (
            SELECT json_build_object(
                'total_products', COUNT(*),
                'total_stock_value', COALESCE(SUM(COALESCE(stock_quantity, 0) * selling_price), 0),
                'low_stock_items', COUNT(*) FILTER (WHERE stock_quantity <= COALESCE(low_stock_threshold, 10))
            )
            FROM products
            WHERE owner_id = p_user_id
        ),
        'customer_metrics', json_build_object(
            'total_customers', COALESCE(
                (SELECT COUNT(*) FROM credit_customers WHERE owner_id = p_user_id),
                0
            ),
            'total_debt', COALESCE(
                (SELECT SUM(remaining_amount) 
                 FROM credit_sales 
                 WHERE owner_id = p_user_id 
                 AND is_paid = false), 
                0
            ),
            'customers_with_debt', COALESCE(
                (SELECT COUNT(DISTINCT customer_id) 
                 FROM credit_sales 
                 WHERE owner_id = p_user_id 
                 AND is_paid = false), 
                0
            )
        ),
        'expense_metrics', (
            SELECT json_build_object(
                'total_expenses', COALESCE(SUM(amount), 0),
                'expense_count', COUNT(*)
            )
            FROM expenses
            WHERE owner_id = p_user_id
            AND created_at >= NOW() - (p_days || ' days')::INTERVAL
        ),
        'device_metrics', (
            SELECT json_build_object(
                'active_devices', COUNT(*) FILTER (WHERE is_active = true),
                'total_devices', COUNT(*)
            )
            FROM active_devices
            WHERE user_id = p_user_id
        )
    ) INTO v_result
    FROM profiles p
    WHERE p.id = p_user_id;

    RETURN v_result;
END;
$$;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_all_users_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_analytics(UUID, INTEGER) TO authenticated;

-- Step 5: Test the function (should return user data)
SELECT get_all_users_analytics(30);

-- ===================================================================
-- ✅ DONE! Now refresh your super-admin page
-- ===================================================================
-- If you still see an error, check the browser console for the actual error message
