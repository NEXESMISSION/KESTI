# 🔥 How to Completely Reset Your Database

## ⚠️ WARNING
**THIS WILL DELETE EVERYTHING!**
- All users (from auth.users)
- All business accounts
- All products
- All sales records
- All configuration

**Only do this if you want to start completely fresh!**

---

## 📋 Step-by-Step Instructions

### Step 1: Backup (Optional but Recommended)
If you want to keep any data, backup first:
1. Go to Supabase Dashboard > Database
2. Click "Backups" to download a backup

### Step 2: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your **KESTI 3** project
3. Click **SQL Editor** in the left sidebar

### Step 3: Run the Complete Reset Script
1. Open the file: `scripts/COMPLETE_RESET_AND_SETUP.sql`
2. Copy ALL the contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **RUN** at the bottom right
5. Wait for it to complete (takes 5-10 seconds)

✅ **Your database is now completely reset and rebuilt!**

---

## 🔐 Step 4: Create Your First Super Admin

You have 3 options:

### Option A: Manual in Supabase Auth UI (EASIEST) ⭐

1. **In Supabase Dashboard**, go to **Authentication > Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - Email: `admin@yourdomain.com` (your real email)
   - Password: `YourSecurePassword123!`
   - Auto Confirm User: ✅ **Check this box!**
4. Click **"Create user"**

5. **Go back to SQL Editor** and run:
```sql
UPDATE public.profiles 
SET 
  role = 'super_admin'::user_role,
  full_name = 'Super Administrator',
  pin_code = '1234',
  subscription_ends_at = NOW() + INTERVAL '10 years'
WHERE email = 'admin@yourdomain.com';  -- Use your actual email
```

6. **Verify it worked**:
```sql
SELECT email, role, full_name FROM public.profiles WHERE role = 'super_admin';
```

✅ **Done! You can now login with your super admin account!**

---

### Option B: Use the Super Admin Dashboard

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Go to**: http://localhost:3000/super-admin

3. You'll need to login first. Create a temp user in Supabase Auth UI (see Option A steps 1-4)

4. Login with the temp user, then use the **"Create New Business Account"** button

5. After creating the account, **go back to SQL Editor** and upgrade it to super_admin:
```sql
UPDATE public.profiles 
SET role = 'super_admin'::user_role
WHERE email = 'the-email-you-just-created@example.com';
```

---

### Option C: Use API Endpoint (For Developers)

You can call the create-business API directly:

```bash
# Using curl
curl -X POST http://localhost:3000/api/create-business-consolidated \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!",
    "fullName": "Super Administrator",
    "pin": "1234",
    "subscriptionDays": 3650
  }'
```

Then upgrade to super_admin in SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'super_admin'::user_role
WHERE email = 'admin@yourdomain.com';
```

---

## ✅ Verification

After creating your super admin:

1. **Go to**: http://localhost:3000/super-admin
2. **Login** with your super admin credentials
3. **You should see** the dashboard with the ability to create new business accounts

---

## 🎯 What the Reset Script Did

1. ✅ **Deleted everything**:
   - Dropped all tables
   - Dropped all policies
   - Dropped all functions
   - Dropped all triggers
   - Deleted all auth users

2. ✅ **Rebuilt everything fresh**:
   - Created `profiles` table
   - Created `products` table
   - Created `sales` table
   - Created `sale_items` table
   - Enabled Row Level Security
   - Created security policies
   - Created helper functions
   - **Added auto-profile trigger** (prevents missing profile issues!)

3. ✅ **Performance optimizations**:
   - Created indexes on frequently queried columns
   - Optimized for fast lookups

---

## 📊 Database Schema Overview

After reset, you have these tables:

### `profiles`
- User accounts (super_admin or business_user)
- Subscription info
- PIN codes
- Suspension status

### `products`
- Product catalog for each business
- Prices, categories, barcodes
- Each business only sees their own products

### `sales`
- Sales transactions
- Total amounts
- Timestamps

### `sale_items`
- Individual items in each sale
- Quantities and prices at time of sale
- Links to products

---

## 🛡️ Security Features

✅ **Row Level Security**: Users can only see/modify their own data
✅ **Super admin access**: Can manage all business accounts
✅ **Auto-profile trigger**: New signups automatically get profiles
✅ **Cascade deletes**: Deleting a user removes all their data
✅ **Data validation**: CHECK constraints on prices, quantities

---

## 🚀 Next Steps After Reset

1. ✅ Create your super admin account (see Step 4 above)
2. ✅ Login to super admin dashboard
3. ✅ Create business accounts for your users
4. ✅ Each business can then:
   - Add products
   - Make sales
   - View history
   - Manage their account

---

## 🆘 Troubleshooting

### "Auth users could not be deleted"
- This is normal! 
- The script tries to auto-delete auth users but may not have permission
- **Manually delete them**: Go to Supabase Dashboard > Authentication > Users
- Select all users and click Delete
- Then run the script again

### "Relation does not exist"
- This is fine! It means tables were already deleted
- The script continues anyway

### "Can't login after reset"
- Make sure you created a super admin user (Step 4)
- Check the user exists: `SELECT * FROM auth.users;`
- Check profile exists: `SELECT * FROM public.profiles;`
- Verify role is set: `SELECT email, role FROM public.profiles;`

### "Dashboard shows no accounts"
- Check you're logged in with the super_admin account
- Refresh the page (Ctrl + Shift + R)
- Check profiles exist: `SELECT * FROM public.profiles;`

---

## 💡 Tips

1. **Save your super admin credentials** - You'll need them!
2. **Set a strong password** - This account has full access
3. **Use a memorable PIN** - You'll need it for sensitive operations
4. **Document your setup** - Record what you did for future reference

---

## 📝 Summary

| Step | What to Do | Time |
|------|-----------|------|
| 1 | (Optional) Backup | 2 min |
| 2 | Open SQL Editor | 30 sec |
| 3 | Run reset script | 10 sec |
| 4 | Create super admin | 2 min |
| 5 | Login and test | 1 min |

**Total time: ~5 minutes for a complete fresh start!**

---

**Your database is now clean, secure, and ready to use!** 🎉
