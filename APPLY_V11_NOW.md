# 🚀 CRITICAL: Apply V11 Migration NOW

## You MUST complete these steps for the system to work properly!

### ❌ Current Issues (These will be FIXED after applying V11):
1. **Device limits not working** - You can log in from multiple devices/browsers without limit
2. **"Bucket not found" error** - Cannot upload product images  
3. **"sold_by_user_id null" error** - Cannot complete sales
4. **"business_id null" errors** - Cannot create products, categories, or expenses

---

## 📋 Step-by-Step Fix (5 Minutes)

### Step 1: Apply SQL Migration (2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to your project: **KESTI** (mhxcznejfglcvtrjzlig)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `V11_COMPLETE_FIX.sql` in this folder
6. **Copy ALL the content** from that file
7. **Paste it** into the SQL Editor
8. Click **RUN** button (or press Ctrl+Enter / Cmd+Enter)
9. Wait for "Success" message

### Step 2: Create Storage Bucket (1 minute)

1. In Supabase Dashboard, click **Storage** in the left sidebar
2. Click **Create new bucket**
3. Name: `product_images`
4. **Check "Public bucket"** ✓
5. Click **Create bucket**

6. Click on the `product_images` bucket you just created
7. Click **Policies** tab
8. Click **New policy**
9. Create these 4 policies:

**Policy 1: Upload**
- Policy name: `Allow authenticated users to upload`
- Allowed operations: **INSERT** ✓
- Policy definition: `(bucket_id = 'product_images')`
- Click **Review** then **Save policy**

**Policy 2: Read**
- Policy name: `Public read access`
- Allowed operations: **SELECT** ✓  
- Policy definition: `(bucket_id = 'product_images')`
- Click **Review** then **Save policy**

**Policy 3: Update**
- Policy name: `Allow authenticated users to update`
- Allowed operations: **UPDATE** ✓
- Policy definition: `(bucket_id = 'product_images')`
- Click **Review** then **Save policy**

**Policy 4: Delete**
- Policy name: `Allow authenticated users to delete`
- Allowed operations: **DELETE** ✓
- Policy definition: `(bucket_id = 'product_images')`
- Click **Review** then **Save policy**

### Step 3: Verify Everything Works (2 minutes)

1. Go to your website: https://kesti.vercel.app
2. Log out if you're logged in
3. Log in again
4. Try creating a category - should work now! ✅
5. Try creating a product with an image - should work now! ✅
6. Try completing a sale - should work now! ✅
7. Try logging in from another browser:
   - If device limit is 1, the first browser should auto-logout! ✅
   - You'll see a message about device limit

---

## ✅ What V11 Fixes:

1. **Auto business_id** - Automatically sets business_id when creating products/categories/expenses
2. **Auto sold_by_user_id** - Automatically sets user ID when completing sales
3. **Device Session Management** - Properly enforces device limits:
   - Sessions expire after 5 minutes of inactivity
   - When limit reached, oldest session is automatically kicked out
   - Session monitor checks every 30 seconds
4. **Phone Numbers** - Businesses can now have up to 3 phone numbers
5. **Search Bar** - Super Admin can search businesses by name
6. **Product Images** - Storage bucket for uploading product images

---

## 🆘 Troubleshooting

### If device limits still don't work:
1. Make sure you applied the V11 SQL migration
2. Clear your browser cache and cookies
3. Log out and log in again
4. The device ID is stored in localStorage - you may need to clear it

### If you get "Function not found" errors:
1. Make sure you ran the ENTIRE V11_COMPLETE_FIX.sql file
2. Check in Supabase Dashboard → Database → Functions
3. You should see: register_device_session, check_device_session, update_device_session

### If images still don't work:
1. Make sure the bucket is named exactly: `product_images`
2. Make sure it's set to PUBLIC
3. Make sure all 4 storage policies are created

---

## 📞 Need Help?

If you're still having issues after following these steps, check the Supabase Dashboard for error messages in:
- SQL Editor → Query history
- Database → Logs
- Storage → Logs
