    -- =====================================================
    -- ANALYTICS - CORRECT TABLES (SALES, not credit_sales)
    -- =====================================================
    -- Uses same tables as finance dashboard!
    -- =====================================================

    DROP FUNCTION IF EXISTS get_all_users_analytics(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS get_user_analytics(UUID, INTEGER) CASCADE;

    -- Analytics using CORRECT table: sales (not credit_sales!)
    CREATE OR REPLACE FUNCTION get_all_users_analytics(p_days INTEGER DEFAULT 30)
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    STABLE
    AS $$
    DECLARE
        v_result JSON;
        v_start_date TIMESTAMPTZ;
    BEGIN
        v_start_date := NOW() - (p_days || ' days')::INTERVAL;
        
        SELECT json_agg(
            json_build_object(
                'user_id', p.id,
                'email', p.email,
                'full_name', p.full_name,
                'role', p.role,
                'created_at', p.created_at,
                'is_suspended', COALESCE(p.is_suspended, false),
                'subscription_ends_at', p.subscription_ends_at,
                'subscription_status', CASE
                    WHEN p.subscription_ends_at IS NULL THEN 'no_subscription'
                    WHEN p.subscription_ends_at < NOW() THEN 'expired'
                    WHEN p.subscription_ends_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
                    ELSE 'active'
                END,
                
                -- Sales from sale_items (via SALES table - CORRECT!)
                'total_sales', COALESCE((
                    SELECT SUM(si.price_at_sale * si.quantity)
                    FROM sale_items si
                    JOIN sales s ON s.id = si.sale_id
                    WHERE s.owner_id = p.id
                    AND si.created_at >= v_start_date
                ), 0),
                
                'total_transactions', COALESCE((
                    SELECT COUNT(DISTINCT si.sale_id)
                    FROM sale_items si
                    JOIN sales s ON s.id = si.sale_id
                    WHERE s.owner_id = p.id
                    AND si.created_at >= v_start_date
                ), 0),
                
                'cost_of_goods', COALESCE((
                    SELECT SUM(si.cost_price_at_sale * si.quantity)
                    FROM sale_items si
                    JOIN sales s ON s.id = si.sale_id
                    WHERE s.owner_id = p.id
                    AND si.created_at >= v_start_date
                ), 0),
                
                'outstanding_credit', COALESCE((
                    SELECT SUM(remaining_amount)
                    FROM credit_sales
                    WHERE owner_id = p.id
                    AND is_paid = false
                ), 0),
                
                'total_products', COALESCE((
                    SELECT COUNT(*) FROM products WHERE owner_id = p.id
                ), 0),
                
                'total_customers', COALESCE((
                    SELECT COUNT(*) FROM credit_customers WHERE owner_id = p.id
                ), 0),
                
                'total_logins', COALESCE((
                    SELECT COUNT(*)
                    FROM user_activity_log
                    WHERE user_id = p.id
                    AND activity_type = 'login'
                    AND created_at >= v_start_date
                ), 0),
                
                'last_login', (
                    SELECT MAX(created_at)
                    FROM user_activity_log
                    WHERE user_id = p.id
                    AND activity_type = 'login'
                ),
                
                'active_devices', COALESCE((
                    SELECT COUNT(*) FROM active_devices WHERE user_id = p.id
                ), 0),
                
                'device_limit', COALESCE((
                    SELECT max_devices FROM user_limits WHERE user_id = p.id
                ), 3),
                
                'total_expenses', COALESCE((
                    SELECT SUM(amount)
                    FROM expenses
                    WHERE owner_id = p.id
                    AND created_at >= v_start_date
                ), 0)
                
            ) ORDER BY (
                SELECT COALESCE(SUM(si.price_at_sale * si.quantity), 0)
                FROM sale_items si
                JOIN sales s ON s.id = si.sale_id
                WHERE s.owner_id = p.id
                AND si.created_at >= v_start_date
            ) DESC
        ) INTO v_result
        FROM profiles p
        WHERE p.role = 'business_user';
        
        RETURN COALESCE(v_result, '[]'::JSON);
    END;
    $$;

    -- Detailed analytics
    CREATE OR REPLACE FUNCTION get_user_analytics(p_user_id UUID, p_days INTEGER DEFAULT 30)
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    STABLE
    AS $$
    DECLARE
        v_result JSON;
        v_start_date TIMESTAMPTZ;
    BEGIN
        v_start_date := NOW() - (p_days || ' days')::INTERVAL;
        
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
            
            'sales_summary', json_build_object(
                'total_sales', COALESCE((
                    SELECT SUM(si.price_at_sale * si.quantity)
                    FROM sale_items si
                    JOIN sales s ON s.id = si.sale_id
                    WHERE s.owner_id = p.id
                    AND si.created_at >= v_start_date
                ), 0),
                'total_transactions', COALESCE((
                    SELECT COUNT(DISTINCT si.sale_id)
                    FROM sale_items si
                    JOIN sales s ON s.id = si.sale_id
                    WHERE s.owner_id = p.id
                    AND si.created_at >= v_start_date
                ), 0),
                'avg_transaction', COALESCE((
                    SELECT AVG(sale_total)
                    FROM (
                        SELECT SUM(si.price_at_sale * si.quantity) as sale_total
                        FROM sale_items si
                        JOIN sales s ON s.id = si.sale_id
                        WHERE s.owner_id = p.id
                        AND si.created_at >= v_start_date
                        GROUP BY si.sale_id
                    ) sale_totals
                ), 0),
                'cost_of_goods', COALESCE((
                    SELECT SUM(si.cost_price_at_sale * si.quantity)
                    FROM sale_items si
                    JOIN sales s ON s.id = si.sale_id
                    WHERE s.owner_id = p.id
                    AND si.created_at >= v_start_date
                ), 0),
                'gross_profit', COALESCE((
                    SELECT SUM((si.price_at_sale - si.cost_price_at_sale) * si.quantity)
                    FROM sale_items si
                    JOIN sales s ON s.id = si.sale_id
                    WHERE s.owner_id = p.id
                    AND si.created_at >= v_start_date
                ), 0),
                'outstanding_credit', COALESCE((
                    SELECT SUM(remaining_amount)
                    FROM credit_sales
                    WHERE owner_id = p.id
                    AND is_paid = false
                ), 0)
            ),
            
            'recent_transactions', COALESCE((
                SELECT json_agg(
                    json_build_object(
                        'sale_id', cs.id,
                        'customer_name', cc.name,
                        'total_amount', cs.total_amount,
                        'is_paid', cs.is_paid,
                        'remaining_amount', cs.remaining_amount,
                        'created_at', cs.created_at,
                        'items', (
                            SELECT json_agg(
                                json_build_object(
                                    'product_name', si.product_name,
                                    'quantity', si.quantity,
                                    'price', si.price_at_sale,
                                    'total', si.price_at_sale * si.quantity
                                )
                            )
                            FROM sale_items si
                            WHERE si.sale_id = cs.id
                        )
                    ) ORDER BY cs.created_at DESC
                )
                FROM (
                    SELECT * FROM credit_sales
                    WHERE owner_id = p.id
                    AND created_at >= v_start_date
                    ORDER BY created_at DESC
                    LIMIT 20
                ) cs
                LEFT JOIN credit_customers cc ON cc.id = cs.customer_id
            ), '[]'::json),
            
            'sale_history', COALESCE((
                SELECT json_agg(
                    json_build_object(
                        'product_name', si.product_name,
                        'quantity', si.quantity,
                        'price_at_sale', si.price_at_sale,
                        'cost_price_at_sale', si.cost_price_at_sale,
                        'profit', (si.price_at_sale - si.cost_price_at_sale) * si.quantity,
                        'created_at', si.created_at,
                        'sale_id', s.id
                    ) ORDER BY si.created_at DESC
                )
                FROM (
                    SELECT * FROM sale_items
                    WHERE sale_id IN (
                        SELECT id FROM sales WHERE owner_id = p.id
                    )
                    AND created_at >= v_start_date
                    ORDER BY created_at DESC
                    LIMIT 100
                ) si
                JOIN sales s ON s.id = si.sale_id
            ), '[]'::json),
            
            'products', json_build_object(
                'total_products', COALESCE((
                    SELECT COUNT(*) FROM products WHERE owner_id = p.id
                ), 0),
                'total_stock_value', COALESCE((
                    SELECT SUM(COALESCE(stock_quantity, 0) * selling_price)
                    FROM products WHERE owner_id = p.id
                ), 0),
                'low_stock_count', COALESCE((
                    SELECT COUNT(*)
                    FROM products
                    WHERE owner_id = p.id
                    AND stock_quantity <= COALESCE(low_stock_threshold, 10)
                ), 0),
                'products_list', COALESCE((
                    SELECT json_agg(
                        json_build_object(
                            'name', name,
                            'stock_quantity', stock_quantity,
                            'selling_price', selling_price,
                            'cost_price', cost_price,
                            'category_id', category_id
                        ) ORDER BY created_at DESC
                    )
                    FROM products
                    WHERE owner_id = p.id
                    LIMIT 50
                ), '[]'::json)
            ),
            
            'customers', json_build_object(
                'total_customers', COALESCE((
                    SELECT COUNT(*) FROM credit_customers WHERE owner_id = p.id
                ), 0),
                'customers_with_debt', COALESCE((
                    SELECT COUNT(DISTINCT customer_id)
                    FROM credit_sales
                    WHERE owner_id = p.id AND is_paid = false
                ), 0),
                'customers_list', COALESCE((
                    SELECT json_agg(
                        json_build_object(
                            'name', name,
                            'phone', phone,
                            'total_debt', COALESCE((
                                SELECT SUM(remaining_amount)
                                FROM credit_sales
                                WHERE customer_id = credit_customers.id
                                AND is_paid = false
                            ), 0)
                        ) ORDER BY created_at DESC
                    )
                    FROM credit_customers
                    WHERE owner_id = p.id
                    LIMIT 50
                ), '[]'::json)
            ),
            
            'activity_log', COALESCE((
                SELECT json_agg(
                    json_build_object(
                        'activity_type', activity_type,
                        'activity_data', activity_data,
                        'created_at', created_at
                    ) ORDER BY created_at DESC
                )
                FROM (
                    SELECT * FROM user_activity_log
                    WHERE user_id = p.id
                    AND created_at >= v_start_date
                    ORDER BY created_at DESC
                    LIMIT 50
                ) activity
            ), '[]'::json),
            
            'devices', COALESCE((
                SELECT json_agg(
                    json_build_object(
                        'device_name', device_name,
                        'last_active_at', last_active_at,
                        'ip_address', ip_address
                    ) ORDER BY last_active_at DESC
                )
                FROM active_devices
                WHERE user_id = p.id
            ), '[]'::json)
            
        ) INTO v_result
        FROM profiles p
        WHERE p.id = p_user_id;
        
        RETURN v_result;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION get_all_users_analytics(INTEGER) TO authenticated;
    GRANT EXECUTE ON FUNCTION get_user_analytics(UUID, INTEGER) TO authenticated;

    -- Verify with actual query like finance dashboard
    SELECT '🔍 Checking SALES table (like finance dashboard):' as status;
    SELECT 
        s.owner_id,
        p.email,
        COUNT(si.id) as item_count,
        SUM(si.price_at_sale * si.quantity) as total_revenue
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN profiles p ON p.id = s.owner_id
    GROUP BY s.owner_id, p.email
    ORDER BY total_revenue DESC
    LIMIT 5;

    -- Test function
    SELECT '';
    SELECT '✅ Testing analytics:' as status;
    SELECT 
        data->>'email' as email,
        data->>'total_sales' as sales,
        data->>'total_transactions' as transactions
    FROM json_array_elements(get_all_users_analytics(30)) as data
    LIMIT 3;

    -- Success
    DO $$
    BEGIN
        RAISE NOTICE '';
        RAISE NOTICE '✅ NOW USING CORRECT TABLE: sales (not credit_sales)!';
        RAISE NOTICE '   Same as finance dashboard!';
    END $$;
