-- ====================================================================
-- ENHANCED ANALYTICS SYSTEM - Detailed Per-User Tracking
-- Run this in Supabase SQL Editor for comprehensive analytics
-- ====================================================================

-- Step 1: Create user activity tracking table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'sale', 'product_add', 'customer_add', 'payment_received', etc.
    activity_data JSONB, -- Additional data about the activity
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_composite ON user_activity_log(user_id, activity_type, created_at);

-- Step 3: Create user sales summary table
CREATE TABLE IF NOT EXISTS user_sales_summary (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_sales NUMERIC(12, 2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_products_sold INTEGER DEFAULT 0,
    total_credit_given NUMERIC(12, 2) DEFAULT 0,
    total_credit_received NUMERIC(12, 2) DEFAULT 0,
    total_expenses NUMERIC(12, 2) DEFAULT 0,
    last_sale_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    total_logins INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create function to get comprehensive user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_total_sales NUMERIC;
    v_total_transactions INTEGER;
    v_avg_transaction NUMERIC;
    v_total_products INTEGER;
    v_total_customers INTEGER;
    v_active_days INTEGER;
    v_last_activity TIMESTAMPTZ;
BEGIN
    -- Calculate comprehensive analytics
    SELECT 
        json_build_object(
            'user_info', (
                SELECT json_build_object(
                    'user_id', p.id,
                    'email', p.email,
                    'full_name', p.full_name,
                    'phone', p.phone_number,
                    'role', p.role,
                    'created_at', p.created_at,
                    'subscription_ends_at', p.subscription_ends_at,
                    'is_suspended', p.is_suspended,
                    'profile_completed', p.profile_completed
                )
                FROM profiles p
                WHERE p.id = p_user_id
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
                    'total_stock_value', COALESCE(SUM(cost_price * stock_quantity), 0),
                    'low_stock_items', COUNT(*) FILTER (WHERE stock_quantity <= 10),
                    'out_of_stock_items', COUNT(*) FILTER (WHERE stock_quantity = 0),
                    'active_categories', COUNT(DISTINCT category)
                )
                FROM products
                WHERE owner_id = p_user_id
            ),
            'customer_metrics', json_build_object(
                'total_customers', COALESCE(
                    (SELECT COUNT(*) FROM credit_customers WHERE owner_id = p_user_id),
                    0
                ),
                'customers_with_debt', COALESCE(
                    (SELECT COUNT(DISTINCT customer_id) FROM credit_sales WHERE owner_id = p_user_id AND is_paid = false),
                    0
                ),
                'total_outstanding_debt', COALESCE(
                    (SELECT SUM(remaining_amount) FROM credit_sales WHERE owner_id = p_user_id AND is_paid = false),
                    0
                )
            ),
            'activity_metrics', (
                SELECT json_build_object(
                    'total_logins', COUNT(*) FILTER (WHERE activity_type = 'login'),
                    'total_actions', COUNT(*),
                    'last_login', MAX(created_at) FILTER (WHERE activity_type = 'login'),
                    'active_days', COUNT(DISTINCT DATE(created_at)),
                    'peak_activity_hour', mode() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM created_at))
                )
                FROM user_activity_log
                WHERE user_id = p_user_id
                AND created_at >= NOW() - (p_days || ' days')::INTERVAL
            ),
            'device_metrics', (
                SELECT json_build_object(
                    'total_devices', COUNT(*),
                    'active_devices', COUNT(*) FILTER (WHERE is_active = true),
                    'last_device_active', MAX(last_active_at)
                )
                FROM active_devices
                WHERE user_id = p_user_id
            ),
            'time_period', json_build_object(
                'days', p_days,
                'start_date', NOW() - (p_days || ' days')::INTERVAL,
                'end_date', NOW()
            )
        ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Step 5: Create function to get all users analytics summary
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
                (SELECT SUM(total_amount) FROM credit_sales WHERE owner_id = p.id AND created_at >= NOW() - (p_days || ' days')::INTERVAL), 
                0
            ),
            'total_transactions', COALESCE(
                (SELECT COUNT(*) FROM credit_sales WHERE owner_id = p.id AND created_at >= NOW() - (p_days || ' days')::INTERVAL),
                0
            ),
            'total_products', COALESCE(
                (SELECT COUNT(*) FROM products WHERE owner_id = p.id),
                0
            ),
            'total_customers', COALESCE(
                (SELECT COUNT(*) FROM credit_customers WHERE owner_id = p.id),
                0
            ),
            'outstanding_credit', COALESCE(
                (SELECT SUM(remaining_amount) FROM credit_sales WHERE owner_id = p.id AND is_paid = false),
                0
            ),
            'total_logins', COALESCE(
                (SELECT COUNT(*) FROM user_activity_log WHERE user_id = p.id AND activity_type = 'login' AND created_at >= NOW() - (p_days || ' days')::INTERVAL),
                0
            ),
            'last_login', (
                SELECT MAX(created_at) FROM user_activity_log WHERE user_id = p.id AND activity_type = 'login'
            ),
            'active_devices', COALESCE(
                (SELECT COUNT(*) FROM active_devices WHERE user_id = p.id AND is_active = true),
                0
            ),
            'subscription_status', CASE
                WHEN p.subscription_ends_at IS NULL THEN 'no_subscription'
                WHEN p.subscription_ends_at < NOW() THEN 'expired'
                WHEN p.subscription_ends_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
                ELSE 'active'
            END,
            'is_suspended', p.is_suspended,
            'created_at', p.created_at
        ) AS user_data
        FROM profiles p
        WHERE p.role = 'business_user'
    ) sub;

    RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;

-- Step 6: Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_activity_data JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_activity_log (
        user_id,
        activity_type,
        activity_data,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_activity_data,
        p_ip_address,
        p_user_agent,
        NOW()
    );

    -- Update summary table
    INSERT INTO user_sales_summary (user_id, total_logins, last_login_at, updated_at)
    VALUES (p_user_id, 1, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_logins = user_sales_summary.total_logins + 1,
        last_login_at = NOW(),
        updated_at = NOW();
END;
$$;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_analytics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity(UUID, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- Step 8: Create view for quick user stats
CREATE OR REPLACE VIEW user_performance_summary AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at as user_since,
    COALESCE(uss.total_sales, 0) as lifetime_sales,
    COALESCE(uss.total_transactions, 0) as lifetime_transactions,
    COALESCE(uss.total_logins, 0) as total_logins,
    uss.last_login_at,
    uss.last_sale_at,
    (SELECT COUNT(*) FROM products WHERE user_id = p.id) as total_products,
    (SELECT COUNT(*) FROM credit_customers WHERE user_id = p.id) as total_customers,
    (SELECT COUNT(*) FROM active_devices WHERE user_id = p.id AND is_active = true) as active_devices,
    CASE
        WHEN p.subscription_ends_at IS NULL THEN 'no_subscription'
        WHEN p.subscription_ends_at < NOW() THEN 'expired'
        WHEN p.subscription_ends_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
        ELSE 'active'
    END as subscription_status,
    p.is_suspended
FROM profiles p
LEFT JOIN user_sales_summary uss ON p.id = uss.user_id
WHERE p.role = 'business_user'
ORDER BY uss.total_sales DESC NULLS LAST;

-- Step 9: Test queries
SELECT 'Enhanced Analytics Setup Complete!' as status;

-- Show sample user analytics
SELECT * FROM user_performance_summary LIMIT 5;
