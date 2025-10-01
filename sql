-- ============================================
-- KESTI - Complete Supabase Database Setup
-- Version: 1.0 Final
-- ============================================

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subscription_end_date TIMESTAMPTZ,
  device_limit INT NOT NULL DEFAULT 1,
  pin_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  currency TEXT NOT NULL DEFAULT 'TND',
  phone_primary TEXT,
  phone_secondary TEXT,
  phone_tertiary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'business_admin' CHECK (role IN ('super_admin', 'business_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Device Sessions Table
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  session_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, device_id)
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  buying_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_alert_quantity NUMERIC(10,2) DEFAULT 10,
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'per_weight')),
  unit TEXT DEFAULT 'kg',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales Table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sold_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,2) NOT NULL,
  price_at_sale NUMERIC(10,2) NOT NULL,
  buying_price_at_sale NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency TEXT NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON public.profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_business_id ON public.device_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_last_active ON public.device_sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_categories_business_id ON public.categories(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_id ON public.sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);

-- ============================================
-- 4. CREATE TRIGGER FUNCTIONS
-- ============================================

-- Auto-set business_id from authenticated user's profile
CREATE OR REPLACE FUNCTION auto_set_business_id()
RETURNS TRIGGER AS $$
DECLARE
  user_business_id UUID;
BEGIN
  -- Get business_id from the user's profile
  SELECT business_id INTO user_business_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Set business_id on the new row
  NEW.business_id := user_business_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-set sold_by_user_id for sales
CREATE OR REPLACE FUNCTION auto_set_sold_by_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sold_by_user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Triggers for auto-setting business_id
DROP TRIGGER IF EXISTS set_business_id_on_products ON public.products;
CREATE TRIGGER set_business_id_on_products
  BEFORE INSERT ON public.products
  FOR EACH ROW
  WHEN (NEW.business_id IS NULL)
  EXECUTE FUNCTION auto_set_business_id();

DROP TRIGGER IF EXISTS set_business_id_on_categories ON public.categories;
CREATE TRIGGER set_business_id_on_categories
  BEFORE INSERT ON public.categories
  FOR EACH ROW
  WHEN (NEW.business_id IS NULL)
  EXECUTE FUNCTION auto_set_business_id();

DROP TRIGGER IF EXISTS set_business_id_on_expenses ON public.expenses;
CREATE TRIGGER set_business_id_on_expenses
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  WHEN (NEW.business_id IS NULL)
  EXECUTE FUNCTION auto_set_business_id();

DROP TRIGGER IF EXISTS set_business_id_on_sales ON public.sales;
CREATE TRIGGER set_business_id_on_sales
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  WHEN (NEW.business_id IS NULL)
  EXECUTE FUNCTION auto_set_business_id();

-- Trigger for auto-setting sold_by_user_id
DROP TRIGGER IF EXISTS set_sold_by_on_sales ON public.sales;
CREATE TRIGGER set_sold_by_on_sales
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  WHEN (NEW.sold_by_user_id IS NULL)
  EXECUTE FUNCTION auto_set_sold_by_user_id();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS businesses_super_admin_all ON public.businesses;
DROP POLICY IF EXISTS businesses_business_members ON public.businesses;
DROP POLICY IF EXISTS profiles_super_admin_all ON public.profiles;
DROP POLICY IF EXISTS profiles_own_profile ON public.profiles;
DROP POLICY IF EXISTS device_sessions_all ON public.device_sessions;
DROP POLICY IF EXISTS categories_business_members ON public.categories;
DROP POLICY IF EXISTS products_business_members ON public.products;
DROP POLICY IF EXISTS sales_business_members ON public.sales;
DROP POLICY IF EXISTS sale_items_business_members ON public.sale_items;
DROP POLICY IF EXISTS expenses_business_members ON public.expenses;

-- Businesses Policies
CREATE POLICY businesses_super_admin_all ON public.businesses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY businesses_business_members ON public.businesses
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Profiles Policies
CREATE POLICY profiles_super_admin_all ON public.profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY profiles_own_profile ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Device Sessions Policy
CREATE POLICY device_sessions_all ON public.device_sessions
  FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
    OR business_id IS NULL
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
    OR business_id IS NULL
  );

-- Categories Policy
CREATE POLICY categories_business_members ON public.categories
  FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Products Policy
CREATE POLICY products_business_members ON public.products
  FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Sales Policy
CREATE POLICY sales_business_members ON public.sales
  FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Sale Items Policy
CREATE POLICY sale_items_business_members ON public.sale_items
  FOR ALL TO authenticated
  USING (
    sale_id IN (
      SELECT id FROM sales
      WHERE business_id IN (
        SELECT business_id FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales
      WHERE business_id IN (
        SELECT business_id FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Expenses Policy
CREATE POLICY expenses_business_members ON public.expenses
  FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- ============================================
-- 7. BUSINESS LOGIC FUNCTIONS
-- ============================================

-- Register Device Session with Token
CREATE OR REPLACE FUNCTION register_device_session(
  p_device_id TEXT,
  p_session_token TEXT,
  p_device_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_business_id UUID;
  v_user_role TEXT;
  v_device_limit INT;
  v_current_count INT;
  v_oldest_session_device_id TEXT;
BEGIN
  -- Get user role and business_id
  SELECT role, business_id
  INTO v_user_role, v_business_id
  FROM profiles
  WHERE id = auth.uid();

  -- Super admins bypass device limits entirely
  IF v_user_role = 'super_admin' THEN
    INSERT INTO device_sessions (business_id, device_id, device_name, session_token, created_at, last_active)
    VALUES (NULL, p_device_id, p_device_name, p_session_token, NOW(), NOW())
    ON CONFLICT (business_id, device_id)
    DO UPDATE SET
      session_token = EXCLUDED.session_token,
      last_active = NOW(),
      device_name = COALESCE(EXCLUDED.device_name, device_sessions.device_name);

    RETURN json_build_object(
      'success', true,
      'message', 'Super admin session registered (no limits)',
      'device_id', p_device_id,
      'session_token', p_session_token
    );
  END IF;

  -- For business users, get device limit
  SELECT device_limit INTO v_device_limit
  FROM businesses
  WHERE id = v_business_id;

  IF v_business_id IS NULL OR v_device_limit IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No business associated with this user'
    );
  END IF;

  -- Count current active sessions (excluding this device)
  SELECT COUNT(*)
  INTO v_current_count
  FROM device_sessions
  WHERE business_id = v_business_id
    AND device_id != p_device_id;

  -- If limit is reached, delete the OLDEST session (by creation time)
  IF v_current_count >= v_device_limit THEN
    SELECT device_id INTO v_oldest_session_device_id
    FROM device_sessions
    WHERE business_id = v_business_id
      AND device_id != p_device_id
    ORDER BY created_at ASC, last_active ASC
    LIMIT 1;

    DELETE FROM device_sessions 
    WHERE business_id = v_business_id 
      AND device_id = v_oldest_session_device_id;
  END IF;

  -- Insert or update this device's session with NEW token
  INSERT INTO device_sessions (business_id, device_id, device_name, session_token, created_at, last_active)
  VALUES (v_business_id, p_device_id, p_device_name, p_session_token, NOW(), NOW())
  ON CONFLICT (business_id, device_id)
  DO UPDATE SET
    session_token = EXCLUDED.session_token,
    last_active = NOW(),
    device_name = COALESCE(EXCLUDED.device_name, device_sessions.device_name);

  RETURN json_build_object(
    'success', true,
    'message', 'Device session registered successfully',
    'device_id', p_device_id,
    'session_token', p_session_token,
    'business_id', v_business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check Device Session
CREATE OR REPLACE FUNCTION check_device_session(
  p_device_id TEXT,
  p_session_token TEXT
)
RETURNS JSON AS $$
DECLARE
  v_business_id UUID;
  v_user_role TEXT;
  v_stored_token TEXT;
  v_token_matches BOOLEAN := false;
BEGIN
  -- Get user role and business_id
  SELECT role, business_id
  INTO v_user_role, v_business_id
  FROM profiles
  WHERE id = auth.uid();

  -- Get the stored token for this device
  SELECT session_token INTO v_stored_token
  FROM device_sessions
  WHERE device_id = p_device_id
    AND (
      (v_user_role = 'super_admin' AND business_id IS NULL) OR
      (v_user_role != 'super_admin' AND business_id = v_business_id)
    )
    AND last_active > NOW() - INTERVAL '5 minutes';

  -- Check if tokens match
  v_token_matches := (v_stored_token IS NOT NULL AND v_stored_token = p_session_token);

  RETURN json_build_object(
    'valid', v_token_matches,
    'message', CASE 
      WHEN v_token_matches THEN 'Session is valid'
      WHEN v_stored_token IS NULL THEN 'Session expired or removed due to device limit'
      ELSE 'Session token invalid - another device logged in with your account'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Device Session (Heartbeat)
CREATE OR REPLACE FUNCTION update_device_session(p_device_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_business_id UUID;
  v_user_role TEXT;
  v_updated BOOLEAN := false;
BEGIN
  -- Get user role and business_id
  SELECT role, business_id
  INTO v_user_role, v_business_id
  FROM profiles
  WHERE id = auth.uid();

  -- Update last_active timestamp
  UPDATE device_sessions
  SET last_active = NOW()
  WHERE device_id = p_device_id
    AND (
      (v_user_role = 'super_admin' AND business_id IS NULL) OR
      (v_user_role != 'super_admin' AND business_id = v_business_id)
    )
  RETURNING true INTO v_updated;

  IF v_updated THEN
    RETURN json_build_object('success', true, 'message', 'Session updated');
  ELSE
    RETURN json_build_object('success', false, 'message', 'Session not found');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Business Settings
CREATE OR REPLACE FUNCTION update_business_settings(
  p_business_id UUID,
  p_name TEXT DEFAULT NULL,
  p_device_limit INT DEFAULT NULL,
  p_pin_code TEXT DEFAULT NULL,
  p_phone_primary TEXT DEFAULT NULL,
  p_phone_secondary TEXT DEFAULT NULL,
  p_phone_tertiary TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_business_id UUID;
BEGIN
  SELECT business_id INTO v_business_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_business_id != p_business_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  UPDATE businesses
  SET
    name = COALESCE(p_name, name),
    device_limit = COALESCE(p_device_limit, device_limit),
    pin_code = COALESCE(p_pin_code, pin_code),
    phone_primary = COALESCE(p_phone_primary, phone_primary),
    phone_secondary = COALESCE(p_phone_secondary, phone_secondary),
    phone_tertiary = COALESCE(p_phone_tertiary, phone_tertiary)
  WHERE id = p_business_id;

  RETURN json_build_object('success', true, 'message', 'Settings updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- 9. CREATE STORAGE BUCKET (Instructions)
-- ============================================

-- NOTE: Run this AFTER the above SQL, in Supabase Dashboard > Storage:
--
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket: "product_images"
-- 3. Set as PUBLIC bucket
-- 4. Add these policies in the bucket settings:
--
-- INSERT policy:
--   Name: allow_authenticated_uploads
--   Target roles: authenticated
--   Policy: (bucket_id = 'product_images')
--
-- UPDATE policy:
--   Name: allow_authenticated_updates
--   Target roles: authenticated  
--   Policy: (bucket_id = 'product_images')
--
-- DELETE policy:
--   Name: allow_authenticated_deletes
--   Target roles: authenticated
--   Policy: (bucket_id = 'product_images')
--
-- SELECT policy:
--   Name: allow_public_reads
--   Target roles: public, authenticated
--   Policy: (bucket_id = 'product_images')

-- ============================================
-- ✅ DATABASE SETUP COMPLETE!
-- ============================================

-- Next steps:
-- 1. Create super admin user in Supabase Auth
-- 2. Run: INSERT INTO profiles (id, role) VALUES ('<super-admin-user-id>', 'super_admin');
-- 3. Create product_images storage bucket with policies
-- 4. Test the application!