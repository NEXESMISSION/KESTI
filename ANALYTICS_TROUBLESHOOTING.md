# 🔧 Analytics Troubleshooting Guide

## ⚠️ Problem: "User Analytics not set up yet" Error

---

## 🎯 **SOLUTION - Follow These Steps:**

### **Step 1: Run the Fix SQL**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `FIX_ANALYTICS_NOW.sql`
4. **Copy ALL the contents**
5. **Paste** into Supabase SQL Editor
6. Click **RUN** ▶️

---

### **Step 2: Verify the Function Was Created**

Run this in Supabase SQL Editor:

```sql
-- Check if function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_all_users_analytics';
```

**Expected Result:**
```
routine_name              | routine_type
-------------------------|--------------
get_all_users_analytics  | FUNCTION
```

If you see this, the function exists! ✅

---

### **Step 3: Test the Function Manually**

Run this in Supabase SQL Editor:

```sql
-- Test the function
SELECT get_all_users_analytics(30);
```

**Expected Result:** JSON data with user analytics

**If you get an error here**, check:
- Do you have a `profiles` table?
- Do you have a `credit_sales` table?
- Do you have users with `role = 'business_user'`?

---

### **Step 4: Check Table Names**

The function uses these tables:
- `profiles`
- `credit_sales`
- `products`
- `credit_customers`
- `expenses`
- `active_devices`

**Verify they exist:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'credit_sales', 'products', 'credit_customers', 'expenses', 'active_devices');
```

---

### **Step 5: Check Column Names**

**The issue might be column naming!**

Run this to check what columns exist:

```sql
-- Check credit_sales columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'credit_sales';
```

**Common Issues:**
- Is it `owner_id` or `user_id`?
- Is it `total_amount` or `amount`?

---

## 🔍 **Common Errors & Fixes:**

### **Error: "function get_all_users_analytics does not exist"**
**Fix:** Run `FIX_ANALYTICS_NOW.sql` again

### **Error: "column 'owner_id' does not exist"**
**Fix:** The table might use `user_id` instead. Check with:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'credit_sales';
```

Then update the function to use the correct column name.

### **Error: "column 'total_amount' does not exist"**
**Fix:** The column might be named `amount`. Update the function.

---

## 📊 **Alternative: Check Your Actual Schema**

Run this to see your exact credit_sales structure:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'credit_sales'
ORDER BY ordinal_position;
```

**Then tell me what columns you see**, and I'll update the SQL to match YOUR exact schema!

---

## 🚀 **After Running FIX_ANALYTICS_NOW.sql:**

1. **Refresh** your super-admin page
2. **Open browser console** (F12)
3. Look for any error messages
4. **Check the "User Performance" section**
5. If still broken, **check console** - it now shows detailed errors!

---

## 📝 **Still Not Working?**

### **Do This:**

1. Open super-admin page
2. Open browser console (F12)
3. Look for error messages starting with:
   - "User analytics error:"
   - "Error Code:"
   - "Error Message:"
4. **Copy the EXACT error message**
5. Send it to me!

The updated code now shows **detailed error information** so we can see exactly what's wrong.

---

## ✅ **Quick Checklist:**

- [ ] Ran `FIX_ANALYTICS_NOW.sql` in Supabase SQL Editor
- [ ] Verified function exists (Step 2)
- [ ] Tested function manually (Step 3)
- [ ] Checked table names match (Step 4)
- [ ] Checked column names match (Step 5)
- [ ] Refreshed super-admin page
- [ ] Checked browser console for errors

---

## 🎯 **Most Likely Issue:**

**Column naming mismatch!**

The function expects:
- `credit_sales.owner_id`
- `credit_sales.total_amount`

But your database might have:
- `credit_sales.user_id`
- `credit_sales.amount`

**Solution:** Tell me your exact column names and I'll update the SQL!
