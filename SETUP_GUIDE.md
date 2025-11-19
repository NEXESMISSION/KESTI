# KESTI POS - Complete Setup Guide

Quick start guide for setting up KESTI POS from scratch.

## 📦 1. Prerequisites

Before you begin, make sure you have:

- ✅ Node.js 16 or higher
- ✅ npm or yarn
- ✅ Supabase account ([signup here](https://supabase.com))
- ✅ Git (optional, for version control)

---

## 🚀 2. Installation

### Clone or Download the Project

```bash
# If using git
git clone <your-repository-url>
cd kesti

# Or download and extract ZIP, then navigate to folder
cd kesti
```

### Install Dependencies

```bash
npm install
```

This will install all required packages (~2-3 minutes).

---

## 🔐 3. Supabase Setup

### Create a New Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Enter project details:
   - **Name**: KESTI POS
   - **Database Password**: (save this somewhere safe!)
   - **Region**: Choose closest to your location
4. Click **"Create new project"**
5. Wait for setup to complete (~2 minutes)

### Get Your API Keys

1. In your Supabase project, click **"Settings"** (gear icon)
2. Click **"API"** in sidebar
3. You'll need these 3 values:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys") - keep this secret!

---

## ⚙️ 4. Environment Configuration

### Create .env.local File

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Save the file

⚠️ **Important:** Never commit `.env.local` to git! It contains secret keys.

---

## 🗄️ 5. Database Setup

Run these SQL scripts **in order** in Supabase SQL Editor:

### Step 1: Open SQL Editor
1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New Query"**

### Step 2: Run Scripts

Copy and paste each script, then click **"Run"** (or Ctrl+Enter):

#### Script 1: Initialize Database
```
📁 scripts/1_COMPLETE_RESET_AND_SETUP.sql
```
- Creates all tables (profiles, products, sales, expenses, etc.)
- Sets up security policies
- Creates helper functions

#### Script 2: Setup Storage
```
📁 scripts/2_SETUP_STORAGE.sql
```
- Creates storage bucket for product images
- Configures upload permissions

#### Script 3: Create Super Admin
```
📁 scripts/3_CREATE_SUPER_ADMIN.sql
```
- Creates your first admin account
- Credentials: `admin@kesti.com` / `admin123`

#### Script 4: Add Auto-Clear Feature (Optional)
```
📁 scripts/4_ADD_HISTORY_AUTO_CLEAR.sql
```
- Adds automatic history clearing feature
- Run only if you need this feature

### Verify Setup

Run this query to check everything is working:

```sql
-- Should show all your tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should show the admin account
SELECT email, role FROM profiles WHERE role = 'super_admin';
```

---

## 🎯 6. Run the Application

### Development Mode

```bash
npm run dev
```

Application will start at: **http://localhost:3000**

### First Login

1. Open http://localhost:3000
2. Click **"Super Admin Login"** or navigate to `/login`
3. Enter default credentials:
   - **Email:** `admin@kesti.com`
   - **Password:** `admin123`
4. ⚠️ **Change password immediately after first login!**

---

## ✅ 7. Verify Everything Works

### Test Checklist:

- [ ] Can login as super admin
- [ ] Can access Super Admin Dashboard
- [ ] Can create a business account
- [ ] Can upload product images
- [ ] Can add products
- [ ] Can make a sale in POS
- [ ] Can view history
- [ ] Can add expenses

---

## 🚀 8. Production Deployment (Vercel)

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click **"New Project"**
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click **"Deploy"**

### After Deployment

1. Update Supabase Auth settings:
   - Go to Supabase → Authentication → URL Configuration
   - Add your Vercel URL to allowed domains
2. Test the production site
3. Change default passwords!

---

## 📖 9. Next Steps

### Create Your First Business Account

1. Login as super admin
2. Go to **Super Admin Dashboard**
3. Click **"Create New Business"**
4. Fill in details:
   - Business name
   - Email
   - Password
   - PIN code (4-6 digits)
   - Subscription days
5. Click **"Create Account"**

### Add Products

1. Logout and login as business user
2. Go to **Stock Management**
3. Add categories first
4. Add products with images

### Make Your First Sale

1. Go to **POS** page
2. Search and select products
3. Complete checkout

---

## 🔧 Troubleshooting

### Can't connect to Supabase
- ✅ Check `.env.local` has correct values
- ✅ Make sure Supabase project is active
- ✅ Try restarting dev server (`npm run dev`)

### Images not uploading
- ✅ Re-run `scripts/2_SETUP_STORAGE.sql`
- ✅ Check Supabase Storage dashboard
- ✅ Verify bucket is public

### Database errors
- ✅ Re-run all SQL scripts in order
- ✅ Check Supabase logs for errors
- ✅ Verify RLS policies are enabled

### Login not working
- ✅ Clear browser cookies
- ✅ Check email/password are correct
- ✅ Verify user exists in Auth dashboard

---

## 📚 Documentation

- **[Main README](README.md)** - Project overview
- **[SQL Scripts Guide](scripts/README.md)** - Database scripts documentation
- **[API Documentation](pages/api/README.md)** - API endpoints reference

---

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs (Logs & Reports tab)
3. Check browser console for errors (F12)
4. Verify all setup steps were completed

---

## ✨ You're All Set!

Your KESTI POS system is now ready to use. Happy selling! 🎉

**Remember to:**
- ⚠️ Change default passwords
- 🔐 Keep service role key secure
- 💾 Backup your database regularly
- 📊 Monitor your Supabase usage
