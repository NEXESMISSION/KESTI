-- =====================================================
-- FIX RLS PERFORMANCE ISSUES
-- Run this script in Supabase SQL Editor
-- This fixes auth_rls_initplan warnings by wrapping auth.uid() with (select auth.uid())
-- =====================================================

-- =====================================================
-- 1. FIX PROFILES TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;

-- Create optimized policies with (select auth.uid())
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = (select auth.uid()));

-- Combined super admin policy (reduces multiple permissive policies issue)
CREATE POLICY "Super admins full access" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = (select auth.uid()) 
            AND p.role = 'super_admin'
        )
    );

-- =====================================================
-- 2. FIX PRODUCT_CATEGORIES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users manage own categories" ON public.product_categories;

CREATE POLICY "Users manage own categories" ON public.product_categories
    FOR ALL USING (owner_id = (select auth.uid()));

-- =====================================================
-- 3. FIX PRODUCTS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users manage own products" ON public.products;

CREATE POLICY "Users manage own products" ON public.products
    FOR ALL USING (owner_id = (select auth.uid()));

-- =====================================================
-- 4. FIX SALES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users manage own sales" ON public.sales;

CREATE POLICY "Users manage own sales" ON public.sales
    FOR ALL USING (owner_id = (select auth.uid()));

-- =====================================================
-- 5. FIX SALE_ITEMS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users manage own sale items" ON public.sale_items;

CREATE POLICY "Users manage own sale items" ON public.sale_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sales s 
            WHERE s.id = sale_items.sale_id 
            AND s.owner_id = (select auth.uid())
        )
    );

-- =====================================================
-- 6. FIX EXPENSES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users manage own expenses" ON public.expenses;

CREATE POLICY "Users manage own expenses" ON public.expenses
    FOR ALL USING (owner_id = (select auth.uid()));

-- =====================================================
-- 7. FIX ACTIVE_DEVICES TABLE RLS POLICIES
-- =====================================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Users can view own devices" ON public.active_devices;
DROP POLICY IF EXISTS "Super admins can view all devices" ON public.active_devices;

-- Create single combined policy to fix multiple permissive policies issue
CREATE POLICY "Users and admins view devices" ON public.active_devices
    FOR SELECT USING (
        user_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = (select auth.uid()) 
            AND p.role = 'super_admin'
        )
    );

-- =====================================================
-- 8. FIX USER_LIMITS TABLE RLS POLICIES
-- =====================================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Users can view own limit" ON public.user_limits;
DROP POLICY IF EXISTS "Super admins can manage all limits" ON public.user_limits;

-- Create single combined policy
CREATE POLICY "Users and admins access limits" ON public.user_limits
    FOR ALL USING (
        user_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = (select auth.uid()) 
            AND p.role = 'super_admin'
        )
    );

-- =====================================================
-- 9. FIX CREDIT_CUSTOMERS TABLE RLS POLICIES
-- =====================================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Users manage own credit customers" ON public.credit_customers;
DROP POLICY IF EXISTS "Super admins manage all credit customers" ON public.credit_customers;

-- Create single combined policy
CREATE POLICY "Users and admins manage credit customers" ON public.credit_customers
    FOR ALL USING (
        owner_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = (select auth.uid()) 
            AND p.role = 'super_admin'
        )
    );

-- =====================================================
-- 10. FIX CREDIT_SALES TABLE RLS POLICIES
-- =====================================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Users manage own credit sales" ON public.credit_sales;
DROP POLICY IF EXISTS "Super admins manage all credit sales" ON public.credit_sales;

-- Create single combined policy
CREATE POLICY "Users and admins manage credit sales" ON public.credit_sales
    FOR ALL USING (
        owner_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = (select auth.uid()) 
            AND p.role = 'super_admin'
        )
    );

-- =====================================================
-- 11. FIX CREDIT_SALE_ITEMS TABLE RLS POLICIES
-- =====================================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Users manage own credit sale items" ON public.credit_sale_items;
DROP POLICY IF EXISTS "Super admins manage all credit sale items" ON public.credit_sale_items;

-- Create single combined policy
CREATE POLICY "Users and admins manage credit sale items" ON public.credit_sale_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.credit_sales cs 
            WHERE cs.id = credit_sale_items.credit_sale_id 
            AND (
                cs.owner_id = (select auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.profiles p 
                    WHERE p.id = (select auth.uid()) 
                    AND p.role = 'super_admin'
                )
            )
        )
    );

-- =====================================================
-- 12. FIX FUNCTIONS WITH MUTABLE SEARCH PATH
-- =====================================================

-- Drop functions first to allow parameter name changes
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.handle_new_user_limit() CASCADE; -- CASCADE needed for trigger
DROP FUNCTION IF EXISTS public.verify_business_pin(UUID, TEXT);
DROP FUNCTION IF EXISTS public.register_device_session(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.remove_device(TEXT);
DROP FUNCTION IF EXISTS public.update_user_device_limit(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_devices(UUID);
DROP FUNCTION IF EXISTS public.revoke_device(UUID);

-- Fix is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (select auth.uid()) 
        AND role = 'super_admin'
    );
END;
$$;

-- Fix handle_new_user_limit function
CREATE OR REPLACE FUNCTION public.handle_new_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_limits (user_id, device_limit)
    VALUES (NEW.id, 3)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Recreate the trigger for handle_new_user_limit
DROP TRIGGER IF EXISTS on_auth_user_created_limit ON auth.users;
CREATE TRIGGER on_auth_user_created_limit
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_limit();

-- Fix verify_business_pin function
CREATE OR REPLACE FUNCTION public.verify_business_pin(p_user_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stored_pin TEXT;
BEGIN
    SELECT business_pin INTO stored_pin
    FROM public.profiles
    WHERE id = p_user_id;
    
    RETURN stored_pin IS NOT NULL AND stored_pin = p_pin;
END;
$$;

-- Fix register_device_session function
CREATE OR REPLACE FUNCTION public.register_device_session(
    p_device_identifier TEXT,
    p_device_name TEXT DEFAULT 'Unknown Device',
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_device_limit INTEGER;
    v_current_devices INTEGER;
    v_existing_device RECORD;
BEGIN
    v_user_id := (select auth.uid());
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if device already registered
    SELECT * INTO v_existing_device
    FROM public.active_devices
    WHERE user_id = v_user_id AND device_identifier = p_device_identifier;
    
    IF FOUND THEN
        -- Update last activity
        UPDATE public.active_devices
        SET last_activity = NOW(),
            device_name = COALESCE(p_device_name, device_name),
            user_agent = COALESCE(p_user_agent, user_agent),
            ip_address = COALESCE(p_ip_address, ip_address)
        WHERE user_id = v_user_id AND device_identifier = p_device_identifier;
        
        RETURN jsonb_build_object('success', true, 'message', 'Device session updated');
    END IF;
    
    -- Get user's device limit
    SELECT device_limit INTO v_device_limit
    FROM public.user_limits
    WHERE user_id = v_user_id;
    
    IF v_device_limit IS NULL THEN
        v_device_limit := 3;
    END IF;
    
    -- Count current devices
    SELECT COUNT(*) INTO v_current_devices
    FROM public.active_devices
    WHERE user_id = v_user_id;
    
    IF v_current_devices >= v_device_limit THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Device limit reached',
            'current_devices', v_current_devices,
            'device_limit', v_device_limit
        );
    END IF;
    
    -- Register new device
    INSERT INTO public.active_devices (user_id, device_identifier, device_name, user_agent, ip_address)
    VALUES (v_user_id, p_device_identifier, p_device_name, p_user_agent, p_ip_address);
    
    RETURN jsonb_build_object('success', true, 'message', 'Device registered successfully');
END;
$$;

-- Fix remove_device function
CREATE OR REPLACE FUNCTION public.remove_device(p_device_identifier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.active_devices
    WHERE user_id = (select auth.uid()) AND device_identifier = p_device_identifier;
    
    RETURN FOUND;
END;
$$;

-- Fix update_user_device_limit function
CREATE OR REPLACE FUNCTION public.update_user_device_limit(p_user_id UUID, p_new_limit INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only super admins can update limits
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (select auth.uid()) 
        AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Only super admins can update device limits';
    END IF;
    
    UPDATE public.user_limits
    SET device_limit = p_new_limit, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Fix get_user_devices function
CREATE OR REPLACE FUNCTION public.get_user_devices(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    device_identifier TEXT,
    device_name TEXT,
    user_agent TEXT,
    ip_address TEXT,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user UUID;
BEGIN
    v_target_user := COALESCE(p_user_id, (select auth.uid()));
    
    -- Users can only see their own devices, super admins can see any
    IF v_target_user != (select auth.uid()) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (select auth.uid()) 
            AND role = 'super_admin'
        ) THEN
            RAISE EXCEPTION 'Access denied';
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT ad.id, ad.device_identifier, ad.device_name, ad.user_agent, ad.ip_address, ad.last_activity, ad.created_at
    FROM public.active_devices ad
    WHERE ad.user_id = v_target_user
    ORDER BY ad.last_activity DESC;
END;
$$;

-- Fix revoke_device function
CREATE OR REPLACE FUNCTION public.revoke_device(p_device_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.active_devices
    WHERE id = p_device_id
    AND (
        user_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (select auth.uid()) 
            AND role = 'super_admin'
        )
    );
    
    RETURN FOUND;
END;
$$;

-- =====================================================
-- 13. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

-- Index for credit_customers.owner_id
CREATE INDEX IF NOT EXISTS idx_credit_customers_owner_id ON public.credit_customers(owner_id);

-- Index for credit_sale_items.credit_sale_id
CREATE INDEX IF NOT EXISTS idx_credit_sale_items_credit_sale_id ON public.credit_sale_items(credit_sale_id);

-- Index for credit_sale_items.product_id
CREATE INDEX IF NOT EXISTS idx_credit_sale_items_product_id ON public.credit_sale_items(product_id);

-- Index for credit_sales.customer_id
CREATE INDEX IF NOT EXISTS idx_credit_sales_customer_id ON public.credit_sales(customer_id);

-- Index for credit_sales.owner_id
CREATE INDEX IF NOT EXISTS idx_credit_sales_owner_id ON public.credit_sales(owner_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check function search paths
SELECT proname, prosecdef, proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proconfig IS NOT NULL;

-- RLS performance fixes applied successfully!
