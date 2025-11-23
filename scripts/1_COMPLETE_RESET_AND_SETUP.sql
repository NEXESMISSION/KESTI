-- ============================================================================
-- KESTI POS - COMPLETE DATABASE RESET AND SETUP
-- ============================================================================
-- Version: 2.0 (Updated: November 2025)
-- This script completely wipes the database and rebuilds it from scratch
-- 
-- WARNING: THIS WILL DELETE ALL DATA!
-- - All tables will be dropped
-- - All users will be deleted from auth.users
-- - All products, sales, and profiles will be permanently deleted
-- 
-- Use this when you want a completely fresh start
-- 
-- ✅ FEATURES IN THIS VERSION:
-- - Auto-profile trigger with error handling
-- - Auto-clear history feature (days/minutes configurable)
-- - Last history clear timestamp tracking
-- - SET search_path for better security
-- - Graceful failure handling
-- - Row Level Security (RLS) on all tables
-- ============================================================================

-- ============================================================================
-- PART 1: NUCLEAR CLEANUP - DELETE EVERYTHING
-- ============================================================================

-- 1.1: Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 1.2: Drop all RLS policies
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop profile policies
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON profiles', policy_record.policyname);
  END LOOP;
  
  -- Drop product_categories policies
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'product_categories'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON product_categories', policy_record.policyname);
  END LOOP;
  
  -- Drop product policies
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'products'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON products', policy_record.policyname);
  END LOOP;
  
  -- Drop sales policies
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'sales'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON sales', policy_record.policyname);
  END LOOP;
  
  -- Drop sale_items policies
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'sale_items'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON sale_items', policy_record.policyname);
  END LOOP;
  
  -- Drop expenses policies
  FOR policy_record IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'expenses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON expenses', policy_record.policyname);
  END LOOP;
END $$;

-- 1.3: Drop all tables (CASCADE will drop foreign keys)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1.4: Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS create_sale(NUMERIC, JSONB) CASCADE;
DROP FUNCTION IF EXISTS verify_business_pin(TEXT) CASCADE;

-- 1.5: Drop enum type
DROP TYPE IF EXISTS user_role CASCADE;

-- 1.6: Delete all auth users (THIS IS PERMANENT!)
-- Note: This requires superuser privileges
-- If this fails, you'll need to delete users manually from Supabase Auth UI
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users
  LOOP
    DELETE FROM auth.users WHERE id = user_record.id;
  END LOOP;
  RAISE NOTICE 'All auth users deleted';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not delete auth users automatically. Please delete them manually from Supabase Auth UI';
END $$;

SELECT '✅ CLEANUP COMPLETE - All old data deleted!' AS status;

-- ============================================================================
-- PART 2: CREATE DATABASE SCHEMA
-- ============================================================================

-- 2.1: Create user_role enum
CREATE TYPE user_role AS ENUM ('super_admin', 'business_user');

-- 2.2: Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'business_user',
  subscription_ends_at TIMESTAMPTZ,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_message TEXT,
  pin_code TEXT,
  history_auto_clear_days INTEGER DEFAULT NULL,
  history_auto_clear_minutes INTEGER DEFAULT NULL,
  last_history_clear TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3: Create product_categories table
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, name)
);

-- 2.4: Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selling_price NUMERIC NOT NULL CHECK (selling_price >= 0),
  cost_price NUMERIC DEFAULT 0 CHECK (cost_price >= 0),
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  barcode TEXT,
  image_url TEXT,
  unit_type TEXT NOT NULL DEFAULT 'item',
  stock_quantity NUMERIC CHECK (stock_quantity >= 0),
  low_stock_threshold NUMERIC DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5: Create sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT DEFAULT 'cash',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6: Create sale_items table
CREATE TABLE sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price_at_sale NUMERIC NOT NULL CHECK (price_at_sale >= 0),
  cost_price_at_sale NUMERIC DEFAULT 0 CHECK (cost_price_at_sale >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7: Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('one_time', 'recurring')),
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_occurrence_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

SELECT '✅ TABLES CREATED' AS status;

-- 2.8: Add comments to profile columns for documentation
COMMENT ON COLUMN profiles.history_auto_clear_days IS 
'Number of days between automatic history clears. NULL means auto-clear is disabled. Use for production (e.g., 30, 90, 180 days).';

COMMENT ON COLUMN profiles.history_auto_clear_minutes IS 
'Number of minutes between automatic history clears. NULL means disabled. For testing only - overrides days if set.';

COMMENT ON COLUMN profiles.last_history_clear IS 
'Timestamp of the last automatic or manual history clear. NULL means history has never been cleared.';

SELECT '✅ COLUMN COMMENTS ADDED' AS status;

-- ============================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

SELECT '✅ ROW LEVEL SECURITY ENABLED' AS status;

-- ============================================================================
-- PART 4: CREATE FUNCTIONS
-- ============================================================================

-- 4.1: Super admin check function
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  user_role_str TEXT;
BEGIN
  SELECT role::text INTO user_role_str FROM profiles WHERE id = auth.uid();
  RETURN user_role_str = 'super_admin';
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 4.2: Create sale function
CREATE OR REPLACE FUNCTION create_sale(
  sale_total NUMERIC,
  items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_sale_id UUID;
  item JSONB;
BEGIN
  -- Validate authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate sale total
  IF sale_total IS NULL OR sale_total < 0 THEN
    RAISE EXCEPTION 'Invalid sale total';
  END IF;

  -- Create the main sale record
  INSERT INTO public.sales (owner_id, total_amount)
  VALUES (auth.uid(), sale_total)
  RETURNING id INTO new_sale_id;

  -- Insert all sale items
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    INSERT INTO public.sale_items (sale_id, product_id, product_name, quantity, price_at_sale)
    VALUES (
      new_sale_id,
      (item->>'productId')::UUID,
      item->>'productName',
      (item->>'quantity')::NUMERIC,
      (item->>'priceAtSale')::NUMERIC
    );
  END LOOP;

  RETURN new_sale_id;
END;
$$;

-- 4.3: Verify business PIN function
CREATE OR REPLACE FUNCTION verify_business_pin(
  input_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  -- Validate authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the stored PIN
  SELECT pin_code INTO stored_pin
  FROM public.profiles
  WHERE id = auth.uid();

  -- Compare PINs
  IF stored_pin IS NULL THEN
    RETURN false;
  END IF;

  RETURN stored_pin = input_pin;
END;
$$;

-- 4.4: Auto-create profile when user signs up (PREVENTS FUTURE ISSUES!)
-- This trigger has error handling to prevent blocking user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to create profile, but don't block user creation if it fails
  INSERT INTO public.profiles (id, email, role, full_name, created_at, is_suspended)
  VALUES (
    NEW.id,
    NEW.email,
    'business_user'::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but allow user creation to proceed
    RAISE WARNING 'Could not auto-create profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ FUNCTIONS CREATED' AS status;

-- ============================================================================
-- PART 5: CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ TRIGGERS CREATED - New users will auto-get profiles!' AS status;

-- ============================================================================
-- PART 6: CREATE RLS POLICIES
-- ============================================================================

-- 6.1: Profiles policies
CREATE POLICY "Public profiles access" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Super admins manage profiles" 
  ON profiles FOR ALL 
  TO authenticated 
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6.2: Product categories policies
CREATE POLICY "Users manage own categories" 
  ON product_categories FOR ALL 
  TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 6.3: Products policies
CREATE POLICY "Users manage own products" 
  ON products FOR ALL 
  TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 6.4: Sales policies
CREATE POLICY "Users manage own sales" 
  ON sales FOR ALL 
  TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 6.5: Sale items policies
CREATE POLICY "Users manage own sale items" 
  ON sale_items FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_id 
      AND sales.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_id 
      AND sales.owner_id = auth.uid()
    )
  );

-- 6.6: Expenses policies
CREATE POLICY "Users manage own expenses" 
  ON expenses FOR ALL 
  TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

SELECT '✅ RLS POLICIES CREATED' AS status;

-- ============================================================================
-- PART 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_product_categories_owner_id ON product_categories(owner_id);
CREATE INDEX idx_product_categories_name ON product_categories(name);
CREATE INDEX idx_products_owner_id ON products(owner_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_sales_owner_id ON sales(owner_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_ends_at);
CREATE INDEX idx_expenses_owner_id ON expenses(owner_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX idx_expenses_type ON expenses(expense_type);
CREATE INDEX idx_expenses_next_occurrence ON expenses(next_occurrence_date);

SELECT '✅ INDEXES CREATED' AS status;

-- ============================================================================
-- PART 8: VERIFICATION
-- ============================================================================

-- Show what was created
SELECT 
  'Database reset complete!' as message,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables_created,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_created,
  (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('is_super_admin', 'create_sale', 'verify_business_pin', 'handle_new_user')) as functions_created,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as triggers_created;

-- ============================================================================
-- PART 9: NEXT STEPS
-- ============================================================================

SELECT '
✅ DATABASE SETUP COMPLETE!

Next Steps:
-----------
1. Create your first super admin user by running the command below
2. Replace EMAIL, PASSWORD, NAME, and PIN with your values

Example:
--------
' as instructions;

-- ============================================================================
-- PART 10: CREATE YOUR FIRST SUPER ADMIN (OPTIONAL - EDIT AND UNCOMMENT)
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Edit the values below with your actual admin details
-- 2. Uncomment the block (remove the /* and */ lines)
-- 3. Run this script again

/*
DO $$ 
DECLARE
  admin_email TEXT := 'admin@yourdomain.com';  -- ⚠️ CHANGE THIS
  admin_password TEXT := 'SecurePassword123!';  -- ⚠️ CHANGE THIS
  admin_name TEXT := 'Super Administrator';     -- ⚠️ CHANGE THIS
  admin_pin TEXT := '1234';                     -- ⚠️ CHANGE THIS (4-6 digits)
  new_user_id UUID;
BEGIN
  -- This will not work from SQL - you need to use the API
  RAISE NOTICE 'To create your first admin, use the /api/create-business-consolidated endpoint or create manually in Supabase Auth UI then run the sync script';
END $$;
*/

-- ============================================================================
-- ALTERNATIVE: Manual Super Admin Creation
-- ============================================================================

SELECT '
TO CREATE YOUR FIRST SUPER ADMIN:
---------------------------------

Option 1 - Use Supabase Auth UI (RECOMMENDED):
1. Go to Authentication > Users in Supabase Dashboard
2. Click "Add user" > "Create new user"
3. Enter email and password
4. After user is created, run this SQL:

   UPDATE public.profiles 
   SET role = ''super_admin''::user_role,
       full_name = ''Your Name'',
       pin_code = ''1234''
   WHERE email = ''your-email@example.com'';

Option 2 - Use your app (EASIEST):
1. Run your dev server: npm run dev
2. Go to http://localhost:3000/super-admin
3. You may need to login with any temp credentials first
4. Use "Create New Business Account" button
5. Then manually update that user to super_admin role using SQL above

Option 3 - Use the create-business-consolidated API:
Make a POST request to /api/create-business-consolidated with:
{
  "email": "admin@yourdomain.com",
  "password": "SecurePassword123!",
  "fullName": "Super Admin",
  "pin": "1234",
  "subscriptionDays": 365
}

Then update role to super_admin using SQL above.

' as manual_instructions;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '
🎉 DATABASE RESET AND SETUP COMPLETE!
=====================================

What was done:
✅ Deleted all old tables, policies, functions, and triggers
✅ Created user_role enum type
✅ Created profiles table with auto-clear history fields
✅ Created products, sales, sale_items, and expenses tables  
✅ Enabled Row Level Security on all tables
✅ Created helper functions (is_super_admin, create_sale, verify_business_pin)
✅ Created auto-profile trigger (prevents missing profile issues!)
✅ Created RLS policies for data security
✅ Created indexes for better performance

🆕 NEW FEATURES:
✅ Auto-clear history (history_auto_clear_days/minutes)
✅ Last clear timestamp tracking (last_history_clear)
✅ 3-day warning alerts before auto-clear
✅ Configurable per-business auto-clear intervals

Your database is now fresh and ready to use!

⚠️ IMPORTANT NEXT STEPS:
1. Create your first super admin user (see instructions above)
2. Run script 2_SETUP_STORAGE.sql for product images
3. Run script 3_CREATE_SUPER_ADMIN.sql for default admin
4. Optional: Run 4_ADD_HISTORY_AUTO_CLEAR.sql (already included in this script!)

' as final_summary;
