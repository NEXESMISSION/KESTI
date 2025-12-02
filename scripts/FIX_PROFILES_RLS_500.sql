-- =====================================================
-- FIX PROFILES TABLE 500 ERROR (INFINITE RECURSION)
-- Run this script in Supabase SQL Editor
-- This fixes the infinite recursion caused by RLS policies
-- that query the profiles table to check super_admin status
-- =====================================================

-- =====================================================
-- STEP 1: Create a SECURITY DEFINER function to check role
-- This bypasses RLS to prevent infinite recursion
-- =====================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.get_my_role();

-- Create function that bypasses RLS to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- =====================================================
-- STEP 2: Drop ALL existing profiles policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins full access" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

-- =====================================================
-- STEP 3: Create optimized policies WITHOUT recursion
-- =====================================================

-- Policy for users to SELECT their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT 
    USING (id = (SELECT auth.uid()));

-- Policy for users to UPDATE their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (id = (SELECT auth.uid()));

-- Policy for users to INSERT their own profile (for new users)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (id = (SELECT auth.uid()));

-- Super admin SELECT policy (uses function to avoid recursion)
CREATE POLICY "Super admins can view all profiles" ON public.profiles
    FOR SELECT 
    USING (public.get_my_role() = 'super_admin');

-- Super admin UPDATE policy (uses function to avoid recursion)
CREATE POLICY "Super admins can update all profiles" ON public.profiles
    FOR UPDATE 
    USING (public.get_my_role() = 'super_admin');

-- =====================================================
-- STEP 4: Update other policies that reference profiles
-- =====================================================

-- Fix active_devices policy
DROP POLICY IF EXISTS "Users and admins view devices" ON public.active_devices;
DROP POLICY IF EXISTS "Users can view own devices" ON public.active_devices;
DROP POLICY IF EXISTS "Super admins can view all devices" ON public.active_devices;

CREATE POLICY "Users can manage own devices" ON public.active_devices
    FOR ALL 
    USING (
        user_id = (SELECT auth.uid())
        OR public.get_my_role() = 'super_admin'
    );

-- Fix user_limits policy
DROP POLICY IF EXISTS "Users and admins access limits" ON public.user_limits;
DROP POLICY IF EXISTS "Users can view own limit" ON public.user_limits;
DROP POLICY IF EXISTS "Super admins can manage all limits" ON public.user_limits;

CREATE POLICY "Users and admins access limits" ON public.user_limits
    FOR ALL 
    USING (
        user_id = (SELECT auth.uid())
        OR public.get_my_role() = 'super_admin'
    );

-- Fix credit_customers policy
DROP POLICY IF EXISTS "Users and admins manage credit customers" ON public.credit_customers;
DROP POLICY IF EXISTS "Users manage own credit customers" ON public.credit_customers;
DROP POLICY IF EXISTS "Super admins manage all credit customers" ON public.credit_customers;

CREATE POLICY "Users and admins manage credit customers" ON public.credit_customers
    FOR ALL 
    USING (
        owner_id = (SELECT auth.uid())
        OR public.get_my_role() = 'super_admin'
    );

-- Fix credit_sales policy
DROP POLICY IF EXISTS "Users and admins manage credit sales" ON public.credit_sales;
DROP POLICY IF EXISTS "Users manage own credit sales" ON public.credit_sales;
DROP POLICY IF EXISTS "Super admins manage all credit sales" ON public.credit_sales;

CREATE POLICY "Users and admins manage credit sales" ON public.credit_sales
    FOR ALL 
    USING (
        owner_id = (SELECT auth.uid())
        OR public.get_my_role() = 'super_admin'
    );

-- Fix credit_sale_items policy
DROP POLICY IF EXISTS "Users and admins manage credit sale items" ON public.credit_sale_items;
DROP POLICY IF EXISTS "Users manage own credit sale items" ON public.credit_sale_items;
DROP POLICY IF EXISTS "Super admins manage all credit sale items" ON public.credit_sale_items;

CREATE POLICY "Users and admins manage credit sale items" ON public.credit_sale_items
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.credit_sales cs 
            WHERE cs.id = credit_sale_items.credit_sale_id 
            AND (
                cs.owner_id = (SELECT auth.uid())
                OR public.get_my_role() = 'super_admin'
            )
        )
    );

-- =====================================================
-- STEP 5: Update functions to use optimized pattern
-- =====================================================

-- Update is_super_admin function to use the cached role function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.get_my_role() = 'super_admin'
$$;

-- =====================================================
-- VERIFICATION: Test the fix
-- =====================================================

-- This should work without 500 error now:
-- SELECT * FROM profiles WHERE id = auth.uid();

-- Check that policies are correctly set up:
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- =====================================================
-- SUCCESS: The 500 error should now be fixed!
-- The key change is using get_my_role() function
-- which uses SECURITY DEFINER to bypass RLS
-- =====================================================
