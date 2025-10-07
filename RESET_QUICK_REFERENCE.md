# 🚀 Database Reset - Quick Reference Card

## The 2-Step Reset Process

### Step 1️⃣: Reset Database (2 minutes)
1. Go to https://supabase.com → SQL Editor
2. Copy ALL of `scripts/COMPLETE_RESET_AND_SETUP.sql`
3. Paste and click **RUN**
4. Wait for "Database setup complete!" ✅

### Step 2️⃣: Create Super Admin (Manual Method Recommended)

**Option A: Manual (Most Reliable) ⭐ RECOMMENDED**

1. **Create user in Supabase Auth:**
   - Go to Authentication → Users → Add user
   - Email: `quikasalami@gmail.com`
   - Password: `123456`
   - ✅ Check "Auto Confirm User"
   - Click "Create user"

2. **Create profile in SQL Editor:**
   ```sql
   -- Run this in Supabase SQL Editor
   DO $$ 
   DECLARE user_id UUID;
   BEGIN
     SELECT id INTO user_id FROM auth.users WHERE email = 'quikasalami@gmail.com';
     INSERT INTO public.profiles (id, email, role, full_name, pin_code, subscription_ends_at, is_suspended)
     VALUES (user_id, 'quikasalami@gmail.com', 'super_admin'::user_role, 'Super Administrator', '123456', NOW() + INTERVAL '10 years', false)
     ON CONFLICT (id) DO UPDATE SET role = 'super_admin'::user_role, pin_code = '123456';
   END $$;
   ```

**Option B: Automated Script** (may need trigger disabled first)
```bash
node scripts/create-super-admin-complete.js
```
If this fails with "Database error", use Option A instead.

**Done! Total time: ~3 minutes** 🎉

---

## Quick Login Test

1. Go to: http://localhost:3000/super-admin
2. Login with:
   - Email: `quikasalami@gmail.com`
   - Password: `123456`
3. You should see the dashboard! 🎉

---

## What Was Reset?

| Item | Status |
|------|--------|
| All auth users | ❌ Deleted |
| All profiles | ❌ Deleted |
| All products | ❌ Deleted |
| All sales | ❌ Deleted |
| Database schema | ✅ Rebuilt fresh |
| Security policies | ✅ Rebuilt |
| Auto-profile trigger | ✅ Installed |

---

## Troubleshooting

**❌ "Database error creating new user" or "unexpected_failure"**
→ The auto-profile trigger may be causing issues. Disable it first:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```
Then create users manually (Option A above).

**❌ "User not found in auth.users"**
→ Create the user in Supabase Auth UI first (Step 2)

**❌ "Can't login"**
→ Check you used the correct email in Step 2

**❌ "Dashboard shows nothing"**
→ Verify: `SELECT * FROM profiles WHERE role = 'super_admin';`

**❌ "Auth users couldn't be deleted"**
→ Delete manually: Supabase > Authentication > Users > Select All > Delete

---

## Files Reference

```
scripts/
├── COMPLETE_RESET_AND_SETUP.sql    ← Step 1: Run this first
└── create-first-super-admin.sql    ← Step 3: Run this second

Documentation/
├── HOW_TO_RESET_DATABASE.md        ← Full detailed guide
└── RESET_QUICK_REFERENCE.md        ← This file (quick steps)
```

---

## Alternative: Manual SQL Method (If Node.js script doesn't work)

If the automated script fails, you can do it manually:

**Step 1:** Create user in Supabase Auth UI:
- Go to Authentication > Users > Add user
- Email: `quikasalami@gmail.com`
- Password: `123456`
- Check "Auto Confirm User"

**Step 2:** Run this SQL in SQL Editor:

```sql
-- Pre-configured for quikasalami@gmail.com
DO $$ 
DECLARE
  admin_email TEXT := 'quikasalami@gmail.com';  -- ✅ Your email
  admin_name TEXT := 'Super Administrator';     -- ✅ Your name
  admin_pin TEXT := '123456';                   -- ✅ Your PIN
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Create user in Auth UI first!';
  END IF;
  
  INSERT INTO public.profiles (id, email, role, full_name, pin_code, subscription_ends_at, is_suspended)
  VALUES (user_id, admin_email, 'super_admin'::user_role, admin_name, admin_pin, NOW() + INTERVAL '10 years', false)
  ON CONFLICT (id) DO UPDATE SET role = 'super_admin'::user_role, full_name = admin_name, pin_code = admin_pin;
  
  RAISE NOTICE 'Super admin created!';
END $$;

-- Verify
SELECT email, role, full_name FROM public.profiles WHERE role = 'super_admin';
```

---

## 🔑 Your Credentials

- **Email:** quikasalami@gmail.com
- **Password:** 123456
- **PIN:** 123456
- **Dashboard:** http://localhost:3000/super-admin

## Remember These

✅ **Dev server** must be running: `npm run dev`
✅ **Never create users manually** in Supabase Auth without syncing profiles
✅ **Save these credentials** - you'll need them to login!

---

**Keep this file handy for future resets!** 📌
