# 🚀 KESTI 4 POS - Quick Setup Guide

This guide will help you fix the storage bucket and Vercel deployment issues.

---

## ⚡ Quick Fix (5 Minutes)

### Step 1: Create Storage Bucket in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/
   - Select your KESTI project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup Script**
   - Copy ALL contents from `SETUP_STORAGE_BUCKETS.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - You should see: ✅ Success message

4. **Verify the Bucket**
   - Go to "Storage" in the left sidebar
   - You should see `product-images` bucket listed
   - The bucket should show "Public: Yes"

### Step 2: Fix Vercel Framework Settings

#### Option A: Use Vercel Dashboard (Recommended)
1. Go to your Vercel project dashboard
2. Click "Settings" → "General"
3. Under "Framework Preset", select **Next.js**
4. Under "Build & Development Settings":
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `npm run dev`
5. Click "Save"
6. Redeploy your project

#### Option B: Use vercel.json (Already Created)
The `vercel.json` file has been created for you. Just commit and push it:
```bash
git add vercel.json
git commit -m "Add Vercel configuration"
git push
```

### Step 3: Test the Upload

1. **Run your dev server locally:**
   ```bash
   npm run dev
   ```

2. **Navigate to Owner Dashboard**
   - Go to http://localhost:3000/owner-dashboard
   - Try adding a product with an image

3. **Check for errors**
   - Open browser console (F12)
   - You should NO LONGER see "Bucket not found" errors
   - Images should upload successfully! 🎉

---

## 🔍 Troubleshooting

### Still Getting "Bucket not found" Error?

**Check 1: Verify Bucket Exists**
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM storage.buckets WHERE name = 'product-images';
```
Should return 1 row.

**Check 2: Verify Policies Exist**
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%product-images%';
```
Should return 4 policies.

**Check 3: Check Your .env File**
Make sure you have:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel Production Still Shows Wrong Framework?

1. Go to Vercel Dashboard → Your Project → Settings
2. Delete the project (only if necessary)
3. Re-import from GitHub
4. Make sure `vercel.json` is in the root directory
5. Vercel will auto-detect Next.js framework

### Images Upload But Don't Display?

Check your `next.config.js` has the correct image configuration:
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
✅ This is already configured in your project!

---

## 📋 What Was Fixed

### 1. **Storage Bucket Setup** (`SETUP_STORAGE_BUCKETS.sql`)
   - Creates `product-images` bucket with 5MB limit
   - Sets up 4 security policies:
     - Public read access (anyone can view images)
     - Authenticated upload (logged-in users can upload)
     - Authenticated update (users can update their own images)
     - Authenticated delete (users can delete their own images)

### 2. **Vercel Configuration** (`vercel.json`)
   - Explicitly sets framework to Next.js
   - Defines build commands
   - Configures output directory
   - Sets up environment variable references

### 3. **Next.js Configuration** (Already Done)
   - Image optimization for Supabase URLs
   - ESLint and TypeScript configured to allow builds

---

## ✅ Success Checklist

After completing the setup, verify:

- [ ] Storage bucket `product-images` exists in Supabase
- [ ] 4 storage policies are created
- [ ] `vercel.json` file exists in project root
- [ ] Local dev server runs without bucket errors
- [ ] Can upload product images successfully
- [ ] Uploaded images display correctly
- [ ] Vercel deployment shows "Next.js" framework
- [ ] Production deployment works

---

## 🎯 Next Steps

Once everything is working:

1. **Test thoroughly**: Try uploading different image formats (JPEG, PNG, WebP)
2. **Check file size limits**: The bucket is set to 5MB max per file
3. **Monitor storage usage**: Check Supabase dashboard for storage quota
4. **Backup important images**: Consider setting up periodic backups

---

## 💡 Tips

- **Image formats supported**: JPEG, PNG, WebP, GIF
- **Max file size**: 5MB (configurable in SQL script)
- **Storage location**: All images are stored in `product-images/products/` folder
- **Public access**: Images are publicly accessible via URL
- **Authentication**: Only logged-in users can upload images

---

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. Check the browser console for specific error messages
2. Verify your Supabase credentials in `.env`
3. Make sure you're logged in when testing uploads
4. Try clearing browser cache and cookies
5. Check Supabase project status (no outages)

---

**Need more help?** Check these files:
- `SUPABASE_SETUP_STORAGE.md` - Detailed storage setup guide
- `scripts/create-storage-buckets.js` - Automated bucket creation script
- `components/ProductForm.tsx` - Upload component code

Good luck! 🚀
