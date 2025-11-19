# Database Scripts Guide

This folder contains all SQL scripts needed to set up and maintain the KESTI POS database.

## 📋 Setup Scripts (Run in Order)

### 1️⃣ **1_COMPLETE_RESET_AND_SETUP.sql**
**Purpose:** Complete database initialization

**What it does:**
- Drops all existing tables, functions, and policies
- Creates all necessary tables (profiles, products, sales, expenses, etc.)
- Sets up Row Level Security (RLS) policies
- Creates helper functions (create_sale, verify_pin, etc.)
- Sets up auto-create profile trigger

**When to run:**
- First time setup
- Complete database reset
- After major schema changes

**⚠️ WARNING:** This will delete ALL data! Only run on fresh database or when you want to start over.

---

### 2️⃣ **2_SETUP_STORAGE.sql**
**Purpose:** Configure storage buckets for product images

**What it does:**
- Creates `product-images` bucket
- Sets up public access for viewing images
- Configures upload/update/delete policies for authenticated users

**When to run:**
- After running script #1
- If image uploads are not working

---

### 3️⃣ **3_CREATE_SUPER_ADMIN.sql**
**Purpose:** Create the first super admin account

**What it does:**
- Creates admin account (email: admin@kesti.com)
- Sets role to super_admin
- Creates unlimited subscription

**When to run:**
- After running scripts #1 and #2
- First time setup only

**Default Credentials:**
- Email: `admin@kesti.com`
- Password: `admin123`

⚠️ **Change password immediately after first login!**

---

### 4️⃣ **4_ADD_HISTORY_AUTO_CLEAR.sql**
**Purpose:** Add auto-clear history feature

**What it does:**
- Adds `history_auto_clear_days` column to profiles
- Adds `history_auto_clear_minutes` column (for testing)
- Adds `last_history_clear` timestamp column

**When to run:**
- After running scripts #1-3
- If auto-clear countdown feature is needed

**Optional:** Only run if you want the auto-clear history feature.

---

## 🛠️ Utility Scripts

### **DELETE_USER_BY_EMAIL.sql**
**Purpose:** Delete a user account completely

**What it does:**
- Removes user from Supabase Auth
- Deletes profile and all related data

**When to run:**
- To remove a test account
- To delete a business account manually

**How to use:**
1. Open the script
2. Replace `user@example.com` with actual email
3. Run in Supabase SQL Editor

⚠️ **Cannot be undone!**

---

## 📖 How to Run Scripts

### In Supabase Dashboard:

1. Go to your Supabase project
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. Copy and paste the script content
5. Click **"Run"** or press `Ctrl+Enter`
6. Check for "Success" message

### Script Execution Order:

```
First Time Setup:
1_COMPLETE_RESET_AND_SETUP.sql
    ↓
2_SETUP_STORAGE.sql
    ↓
3_CREATE_SUPER_ADMIN.sql
    ↓
4_ADD_HISTORY_AUTO_CLEAR.sql (optional)
```

---

## ✅ Verification Queries

After running setup scripts, verify everything works:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check super admin exists
SELECT id, email, role, subscription_ends_at 
FROM profiles 
WHERE role = 'super_admin';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'product-images';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 🚨 Troubleshooting

### Script fails with "relation already exists"
- Drop the existing table first or use `IF NOT EXISTS`
- Or run script #1 to completely reset

### RLS policy errors
- Make sure you're running as postgres user
- Check if policies already exist

### Storage bucket not working
- Re-run script #2
- Check Supabase Storage dashboard
- Verify bucket is set to public

### Super admin can't login
- Re-run script #3
- Check Supabase Auth dashboard
- Verify email and password are correct

---

## 📝 Notes

- Always backup data before running reset scripts
- Scripts are idempotent where possible (use `IF NOT EXISTS`)
- Check script comments for specific requirements
- Run verification queries after each script

---

## 🔗 Related Documentation

- [Main README](../README.md) - Project overview
- [API Documentation](../pages/api/README.md) - API endpoints
- Supabase Docs: https://supabase.com/docs
