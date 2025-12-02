-- =====================================================
-- FIX RLS FOR CREDIT TABLES
-- =====================================================
-- Run this script in your Supabase SQL Editor to fix the
-- RLS disabled warnings for credit_customers, credit_sales, and credit_sale_items
-- =====================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL CREDIT TABLES
-- =====================================================

ALTER TABLE public.credit_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_sale_items ENABLE ROW LEVEL SECURITY;

SELECT '✅ RLS ENABLED ON ALL CREDIT TABLES' AS status;

-- 2. DROP EXISTING POLICIES (if any)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own credit customers" ON public.credit_customers;
DROP POLICY IF EXISTS "Users can insert own credit customers" ON public.credit_customers;
DROP POLICY IF EXISTS "Users can update own credit customers" ON public.credit_customers;
DROP POLICY IF EXISTS "Users can delete own credit customers" ON public.credit_customers;
DROP POLICY IF EXISTS "Users manage own credit customers" ON public.credit_customers;

DROP POLICY IF EXISTS "Users can view own credit sales" ON public.credit_sales;
DROP POLICY IF EXISTS "Users can insert own credit sales" ON public.credit_sales;
DROP POLICY IF EXISTS "Users can update own credit sales" ON public.credit_sales;
DROP POLICY IF EXISTS "Users can delete own credit sales" ON public.credit_sales;
DROP POLICY IF EXISTS "Users manage own credit sales" ON public.credit_sales;

DROP POLICY IF EXISTS "Users can view own credit sale items" ON public.credit_sale_items;
DROP POLICY IF EXISTS "Users can insert own credit sale items" ON public.credit_sale_items;
DROP POLICY IF EXISTS "Users can update own credit sale items" ON public.credit_sale_items;
DROP POLICY IF EXISTS "Users can delete own credit sale items" ON public.credit_sale_items;
DROP POLICY IF EXISTS "Users manage own credit sale items" ON public.credit_sale_items;

SELECT '✅ OLD POLICIES DROPPED' AS status;

-- 3. CREATE RLS POLICIES FOR CREDIT_CUSTOMERS
-- =====================================================

-- Users can manage their own credit customers
CREATE POLICY "Users manage own credit customers" 
ON public.credit_customers FOR ALL 
TO authenticated 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Super admins can manage all credit customers
CREATE POLICY "Super admins manage all credit customers" 
ON public.credit_customers FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

SELECT '✅ CREDIT_CUSTOMERS POLICIES CREATED' AS status;

-- 4. CREATE RLS POLICIES FOR CREDIT_SALES
-- =====================================================

-- Users can manage their own credit sales
CREATE POLICY "Users manage own credit sales" 
ON public.credit_sales FOR ALL 
TO authenticated 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Super admins can manage all credit sales
CREATE POLICY "Super admins manage all credit sales" 
ON public.credit_sales FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

SELECT '✅ CREDIT_SALES POLICIES CREATED' AS status;

-- 5. CREATE RLS POLICIES FOR CREDIT_SALE_ITEMS
-- =====================================================

-- Users can manage credit sale items for their own credit sales
CREATE POLICY "Users manage own credit sale items" 
ON public.credit_sale_items FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.credit_sales cs 
    WHERE cs.id = credit_sale_items.credit_sale_id 
    AND cs.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.credit_sales cs 
    WHERE cs.id = credit_sale_items.credit_sale_id 
    AND cs.owner_id = auth.uid()
  )
);

-- Super admins can manage all credit sale items
CREATE POLICY "Super admins manage all credit sale items" 
ON public.credit_sale_items FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

SELECT '✅ CREDIT_SALE_ITEMS POLICIES CREATED' AS status;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
  'credit_customers' as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'credit_customers'

UNION ALL

SELECT 
  'credit_sales' as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'credit_sales'

UNION ALL

SELECT 
  'credit_sale_items' as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'credit_sale_items';

SELECT '✅ RLS FIX COMPLETE - All credit tables now have proper security!' AS status;
