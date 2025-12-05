# ⚠️ URGENT: Run This SQL to Fix Errors

## 🚨 Error You're Seeing:
```
column "total" does not exist
```

## ✅ Quick Fix (5 Minutes):

### **Step 1: Open Supabase**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar

### **Step 2: Run This SQL File**
1. Open file: `ENHANCED_ANALYTICS.sql`
2. Copy **ALL** the content (Ctrl+A, Ctrl+C)
3. Paste in Supabase SQL Editor
4. Click **RUN** button (or press F5)

### **Step 3: Verify**
You should see:
```
Enhanced Analytics Setup Complete!
```

### **Step 4: Test**
1. Refresh your browser (F5)
2. Go to Super Admin dashboard
3. Click "👤 User Performance" tab
4. ✅ Should work now!

---

## 📋 **Alternative: Run Individual Commands**

If the full file has errors, run these one by one:

### **1. Create user_activity_log table:**
```sql
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### **2. Create indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at);
```

### **3. Create user_sales_summary table:**
```sql
CREATE TABLE IF NOT EXISTS user_sales_summary (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_sales NUMERIC(12, 2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_products_sold INTEGER DEFAULT 0,
    total_credit_given NUMERIC(12, 2) DEFAULT 0,
    total_credit_received NUMERIC(12, 2) DEFAULT 0,
    total_expenses NUMERIC(12, 2) DEFAULT 0,
    last_sale_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    total_logins INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 **What This Fixes:**
- ✅ User Performance Analytics tab
- ✅ Detailed per-user metrics
- ✅ Sales tracking
- ✅ Login activity tracking
- ✅ Top performers leaderboard

---

## ⏰ **How Long:** 2-5 minutes

**Just run the SQL file and you're done!** 🚀
