# 👥 Create Two Accounts - Complete Guide

## 📋 Accounts to Create

1. **Super Admin:** quikasalami@gmail.com
2. **Business User:** nexesmission@gmail.com

Both with password: `123456`

---

## 🎯 Method 1: Manual (Recommended)

### Step 1: Create Auth Users in Supabase

1. **Go to Supabase Dashboard** → https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to:** Authentication → Users
4. **Click "Add user"** → "Create new user"

**First User (Super Admin):**
- Email: `quikasalami@gmail.com`
- Password: `123456`
- ✅ Check "Auto Confirm User"
- Click "Create user"

**Second User (Business):**
- Click "Add user" again
- Email: `nexesmission@gmail.com`
- Password: `123456`
- ✅ Check "Auto Confirm User"
- Click "Create user"

### Step 2: Create Profiles with SQL

Copy and run this in **Supabase SQL Editor**:

```sql
-- Create profiles for both users
DO $$ 
DECLARE 
  super_admin_id UUID;
  business_user_id UUID;
BEGIN
  -- Get user IDs from auth
  SELECT id INTO super_admin_id 
  FROM auth.users 
  WHERE email = 'quikasalami@gmail.com';
  
  SELECT id INTO business_user_id 
  FROM auth.users 
  WHERE email = 'nexesmission@gmail.com';
  
  -- Check if users exist
  IF super_admin_id IS NULL THEN
    RAISE EXCEPTION 'Super admin user not found. Create quikasalami@gmail.com in Auth first.';
  END IF;
  
  IF business_user_id IS NULL THEN
    RAISE EXCEPTION 'Business user not found. Create nexesmission@gmail.com in Auth first.';
  END IF;
  
  -- Create/Update Super Admin Profile
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    full_name, 
    pin_code, 
    subscription_ends_at, 
    is_suspended
  )
  VALUES (
    super_admin_id,
    'quikasalami@gmail.com',
    'super_admin'::user_role,
    'Super Administrator',
    '123456',
    NOW() + INTERVAL '10 years',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin'::user_role,
    pin_code = '123456',
    subscription_ends_at = NOW() + INTERVAL '10 years',
    is_suspended = false;
  
  -- Create/Update Business User Profile
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    full_name, 
    pin_code, 
    subscription_ends_at, 
    is_suspended
  )
  VALUES (
    business_user_id,
    'nexesmission@gmail.com',
    'business_user'::user_role,
    'Business User',
    '123456',
    NOW() + INTERVAL '1 year',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'business_user'::user_role,
    pin_code = '123456',
    subscription_ends_at = NOW() + INTERVAL '1 year',
    is_suspended = false;
  
  RAISE NOTICE 'Both accounts created successfully!';
  RAISE NOTICE 'Super Admin: quikasalami@gmail.com';
  RAISE NOTICE 'Business User: nexesmission@gmail.com';
END $$;

-- Verify the accounts were created
SELECT 
  email, 
  role, 
  full_name, 
  pin_code,
  subscription_ends_at,
  is_suspended
FROM public.profiles
WHERE email IN ('quikasalami@gmail.com', 'nexesmission@gmail.com')
ORDER BY role DESC;
```

---

## ✅ Expected Result

You should see:

```
NOTICE: Both accounts created successfully!
NOTICE: Super Admin: quikasalami@gmail.com
NOTICE: Business User: nexesmission@gmail.com
```

And a table showing:

| email | role | full_name | pin_code | subscription_ends_at | is_suspended |
|-------|------|-----------|----------|---------------------|--------------|
| quikasalami@gmail.com | super_admin | Super Administrator | 123456 | 2035-... | false |
| nexesmission@gmail.com | business_user | Business User | 123456 | 2026-... | false |

---

## 🔑 Account Details

### Super Admin Account
```
Email: quikasalami@gmail.com
Password: 123456
PIN: 123456
Role: super_admin
Subscription: 10 years
Dashboard: http://localhost:3000/super-admin
```

**Capabilities:**
- ✅ Manage all business accounts
- ✅ Create/delete business users
- ✅ Extend subscriptions
- ✅ Suspend/unsuspend accounts
- ✅ Full system access

### Business User Account
```
Email: nexesmission@gmail.com
Password: 123456
PIN: 123456
Role: business_user
Subscription: 1 year
Dashboard: http://localhost:3000/owner-dashboard
```

**Capabilities:**
- ✅ Manage products
- ✅ Use POS system
- ✅ View finances
- ✅ Track expenses
- ✅ View sales history
- ❌ Cannot manage other users

---

## 🎯 Method 2: Copy-Paste Quick SQL

If users already exist in Auth, just run this:

```sql
-- Quick create for both accounts (if auth users exist)
INSERT INTO public.profiles (id, email, role, full_name, pin_code, subscription_ends_at, is_suspended)
SELECT 
  id,
  email,
  CASE 
    WHEN email = 'quikasalami@gmail.com' THEN 'super_admin'::user_role
    ELSE 'business_user'::user_role
  END as role,
  CASE 
    WHEN email = 'quikasalami@gmail.com' THEN 'Super Administrator'
    ELSE 'Business User'
  END as full_name,
  '123456' as pin_code,
  CASE 
    WHEN email = 'quikasalami@gmail.com' THEN NOW() + INTERVAL '10 years'
    ELSE NOW() + INTERVAL '1 year'
  END as subscription_ends_at,
  false as is_suspended
FROM auth.users
WHERE email IN ('quikasalami@gmail.com', 'nexesmission@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  pin_code = EXCLUDED.pin_code,
  subscription_ends_at = EXCLUDED.subscription_ends_at;
```

---

## 🚀 Testing Your Accounts

### Test Super Admin:
1. Go to http://localhost:3000/super-admin
2. Login with:
   - Email: quikasalami@gmail.com
   - Password: 123456
3. You should see the Super Admin Dashboard
4. You can manage business accounts

### Test Business User:
1. Go to http://localhost:3000/login
2. Login with:
   - Email: nexesmission@gmail.com
   - Password: 123456
3. You should see the Owner Dashboard
4. You can:
   - Add products
   - Use POS
   - View finances
   - Track expenses

---

## ⚠️ Important Notes

### Auth Users MUST Be Created First!
- SQL cannot create Supabase Auth users
- You must create them in the Supabase Auth UI first
- Then run the SQL to create profiles

### Alternative: Use the API
If you want full automation, use the Node.js script:
```bash
# Edit the script to add nexesmission@gmail.com
# Then run:
node scripts/create-super-admin-complete.js
```

### Password Requirements
- Supabase requires minimum 6 characters
- "123456" meets this requirement
- In production, use stronger passwords!

---

## 🔄 If Something Goes Wrong

### User Not Found Error?
```
ERROR: Super admin user not found. Create quikasalami@gmail.com in Auth first.
```

**Solution:** Create the auth user in Supabase Auth UI first

### Conflict Error?
```
ERROR: duplicate key value violates unique constraint
```

**Solution:** Profile already exists. The SQL will update it with ON CONFLICT

### Can't Login?
**Check:**
1. User is created in Supabase Auth
2. User is confirmed (check "Auto Confirm User")
3. Profile exists in profiles table
4. Password is correct (123456)
5. Dev server is running (npm run dev)

---

## 📊 Verify Accounts

Run this to check both accounts:

```sql
-- Check if accounts exist and are configured correctly
SELECT 
  p.email,
  p.role,
  p.full_name,
  p.pin_code,
  p.is_suspended,
  p.subscription_ends_at,
  CASE 
    WHEN p.subscription_ends_at > NOW() THEN '✅ Active'
    ELSE '❌ Expired'
  END as status,
  a.confirmed_at IS NOT NULL as is_confirmed
FROM public.profiles p
LEFT JOIN auth.users a ON a.id = p.id
WHERE p.email IN ('quikasalami@gmail.com', 'nexesmission@gmail.com')
ORDER BY p.role DESC;
```

Expected output:
```
quikasalami@gmail.com  | super_admin   | ✅ Active | true
nexesmission@gmail.com | business_user | ✅ Active | true
```

---

## ✅ Checklist

**Before Running SQL:**
- [ ] Database is reset (ran COMPLETE_RESET_AND_SETUP.sql)
- [ ] Created quikasalami@gmail.com in Supabase Auth UI
- [ ] Created nexesmission@gmail.com in Supabase Auth UI
- [ ] Both users are "Auto Confirmed"

**After Running SQL:**
- [ ] Verify both profiles exist (run verification query)
- [ ] Test super admin login
- [ ] Test business user login
- [ ] Super admin can access /super-admin
- [ ] Business user can access /owner-dashboard

---

## 🎉 Success!

If everything works:
- ✅ Both accounts are created
- ✅ Super admin has full control
- ✅ Business user can operate POS
- ✅ Both can login successfully
- ✅ Proper roles assigned
- ✅ Subscriptions active

**You're ready to use the system!** 🚀
