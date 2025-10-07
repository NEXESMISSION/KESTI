# 🔧 Fix Storage & Vercel Issues - Complete Guide

## 🎯 Problems Identified

1. **Storage Bucket Missing**: `product-images` bucket doesn't exist in Supabase
2. **Vercel Framework Mismatch**: Production shows different settings than local
3. **React Warning**: `fetchPriority` prop warning (harmless, but annoying)

---

## ✅ Solution Overview

I've created the following files to fix your issues:

1. **SETUP_STORAGE_BUCKETS.sql** - SQL script to create bucket + policies
2. **vercel.json** - Vercel configuration file
3. **QUICK_SETUP_GUIDE.md** - Detailed setup instructions
4. **Updated scripts/create-storage-buckets.js** - Improved automation script

---

## 🚀 Quick Fix (Choose ONE method)

### Method 1: SQL Script (RECOMMENDED - 2 minutes)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com/
   - Select your KESTI project
   - Click "SQL Editor" in sidebar

2. **Run the SQL Script**
   ```
   - Open file: SETUP_STORAGE_BUCKETS.sql
   - Copy ALL contents
   - Paste in SQL Editor
   - Click "Run" (or Ctrl+Enter)
   ```

3. **Verify Success**
   - Go to "Storage" in sidebar
   - You should see `product-images` bucket
   - It should show "Public: Yes"

✅ **Done!** Skip to "Fix Vercel Settings" below

### Method 2: Automated Script (Alternative)

1. **Run the script**
   ```bash
   node scripts/create-storage-buckets.js
   ```

2. **If it succeeds**: You'll see ✅ messages
3. **If it fails**: It will show you manual steps

⚠️ **Note**: This requires `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file

---

## 🔧 Fix Vercel Settings

### Option A: Vercel Dashboard (Quick)

1. Go to https://vercel.com/dashboard
2. Select your KESTI project
3. Go to **Settings** → **General**
4. Under "Framework Preset": Select **Next.js**
5. Under "Build & Development Settings":
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `npm run dev`
6. Click **Save**
7. Redeploy your site

### Option B: Use vercel.json (Automatic)

The `vercel.json` file has been created for you! Just commit it:

```bash
git add vercel.json
git commit -m "Add Vercel configuration"
git push
```

Vercel will automatically detect and use this configuration on next deploy.

---

## 🧪 Test Everything

### 1. Test Locally

```bash
# Start dev server
npm run dev
```

Navigate to: http://localhost:3000/owner-dashboard

Try to add a product with an image:
- ✅ Should upload successfully
- ✅ Image should display
- ✅ No "Bucket not found" errors in console

### 2. Check Console

Open browser console (F12) and look for:
- ❌ **BEFORE**: "Bucket not found", "400 Bad Request"
- ✅ **AFTER**: No storage errors!

### 3. Verify in Supabase

1. Go to Supabase Dashboard → Storage
2. Click `product-images` bucket
3. Navigate to `products/` folder
4. You should see your uploaded images

---

## 📋 What Was Created/Fixed

### New Files Created:

1. **SETUP_STORAGE_BUCKETS.sql**
   - Creates `product-images` bucket
   - Sets up 4 security policies
   - Configures public access

2. **vercel.json**
   - Explicitly sets framework to Next.js
   - Defines build commands
   - Configures output directory

3. **QUICK_SETUP_GUIDE.md**
   - Comprehensive troubleshooting guide
   - Step-by-step instructions
   - Success checklist

### Files Updated:

1. **scripts/create-storage-buckets.js**
   - Better error handling
   - Clearer console output
   - Automatic fallback instructions

---

## 🔍 Understanding the Issues

### Issue 1: Missing Storage Bucket

**Why it happened:**
- Supabase projects don't create custom buckets by default
- You need to manually create buckets for file storage

**What the error meant:**
```
Product-images bucket does not exist, falling back to public bucket
POST .../storage/v1/object/public/products/... 400 (Bad Request)
Error uploading image: StorageApiError: Bucket not found
```

**The fix:**
- Created `product-images` bucket with proper configuration
- Added security policies for access control
- Enabled public read access

### Issue 2: Vercel Framework Mismatch

**Why it happened:**
- Vercel couldn't auto-detect your Next.js framework
- Production deployment used different settings than local

**What you saw:**
```
Configuration Settings in the current Production deployment 
differ from your current Project Settings
```

**The fix:**
- Created `vercel.json` with explicit Next.js configuration
- Ensures consistent builds between local and production

### Issue 3: React fetchPriority Warning

**Why it happens:**
```
Warning: React does not recognize the `fetchPriority` prop on a DOM element
```

This is a known issue with Next.js 14.0.4 and React 18. The Next.js `Image` component internally uses `fetchPriority`, but React warns about it.

**Is it serious?**
❌ No! It's just a warning and doesn't break functionality.

**How to fix:**
1. **Ignore it** (recommended) - it doesn't affect your app
2. **Upgrade Next.js** to 14.1.0+ (they fixed it)
3. **Suppress the warning** (not recommended)

**To upgrade Next.js:**
```bash
npm install next@latest react@latest react-dom@latest
```

---

## ✅ Success Checklist

After completing the setup, verify:

- [ ] Storage bucket `product-images` exists in Supabase
- [ ] 4 storage policies are created (check Supabase → Storage → Policies)
- [ ] `vercel.json` file exists in project root
- [ ] Local dev server runs: `npm run dev`
- [ ] Can upload product images successfully
- [ ] Uploaded images display correctly
- [ ] No "Bucket not found" errors in console
- [ ] Vercel deployment shows "Next.js" framework
- [ ] Production site uploads work

---

## 🆘 Troubleshooting

### Still Getting "Bucket not found"?

**1. Verify bucket exists:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM storage.buckets WHERE name = 'product-images';
```
Should return 1 row.

**2. Check policies:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```
Should return at least 4 policies.

**3. Check authentication:**
- Make sure you're logged in
- Check browser console for auth errors
- Verify your `.env` has correct Supabase credentials

### Vercel Still Shows Wrong Framework?

1. Delete `.next` folder locally: `rm -rf .next` or `rmdir /s .next`
2. Make sure `vercel.json` is committed to Git
3. Trigger a new deployment
4. If still wrong, go to Vercel Dashboard → Settings → General
5. Manually select "Next.js" from Framework Preset dropdown

### Images Upload But Don't Display?

Check `next.config.js` has:
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
  ],
}
```
✅ This is already configured!

---

## 📞 Next Steps

1. ✅ Run the SQL script: `SETUP_STORAGE_BUCKETS.sql`
2. ✅ Commit `vercel.json`: `git add vercel.json && git commit -m "Add Vercel config"`
3. ✅ Test locally: `npm run dev`
4. ✅ Test upload functionality
5. ✅ Deploy to Vercel
6. ✅ Test production site

---

## 💡 Pro Tips

- **Image formats**: JPEG, PNG, WebP, GIF supported
- **Max file size**: 5MB (configurable in SQL script)
- **Storage location**: All images in `product-images/products/` folder
- **Public access**: Images are publicly accessible via URL
- **Authentication**: Only logged-in users can upload

---

## 📚 Related Documentation

- **QUICK_SETUP_GUIDE.md** - Detailed setup instructions
- **SUPABASE_SETUP_STORAGE.md** - Original storage documentation
- **SETUP_STORAGE_BUCKETS.sql** - SQL script to run
- **scripts/create-storage-buckets.js** - Automation script

---

**Good luck! 🚀**

If you follow these steps, your storage and Vercel issues should be completely resolved.
