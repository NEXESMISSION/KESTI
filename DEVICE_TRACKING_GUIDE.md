# 🔧 Device Tracking - Complete Fix & Test Guide

## ⚠️ **CRITICAL: Run SQL First!**

Device tracking won't work until you run the database setup!

### **Step 1: Run DEVICE_FIX_COMPLETE.sql**

1. Open Supabase Dashboard → SQL Editor
2. Copy ALL content from `DEVICE_FIX_COMPLETE.sql`  
3. Click **RUN**
4. ✅ Should say "Device tracking setup complete!"

---

## 🧪 **How to Test Device Tracking**

### **Test 1: Check Console Logs**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Login with a regular business user
4. Look for these logs:

```
🔷 [DeviceManager] Starting device registration...
✓ [DeviceManager] Session found for user: xxx
✓ [DeviceManager] Profile found: email@example.com (business_user)
📱 [DeviceManager] Device ID: abc-123-def
📱 [DeviceManager] Device Name: Chrome on Windows
🌐 [DeviceManager] IP Address: xxx.xxx.xxx.xxx
📡 [DeviceManager] Calling register_device_session RPC...
✅ [DeviceManager] Device registration response: {success: true, ...}
✅ [DeviceManager] Device registered successfully! Action: registered
```

### **Test 2: Check Supabase Database**

Run this in Supabase SQL Editor:

```sql
-- Show all devices
SELECT 
    p.email,
    p.full_name,
    ad.device_name,
    ad.is_active,
    ad.last_active_at,
    ad.registered_at
FROM active_devices ad
JOIN profiles p ON ad.user_id = p.id
ORDER BY ad.registered_at DESC;
```

You should see devices listed!

### **Test 3: Check Super Admin Dashboard**

1. Login as super admin
2. Go to `/super-admin`
3. Look at the businesses table
4. Device column should show `📱 1/3` or `📱 2/3`

---

## 🐛 **Troubleshooting**

### **Problem: Console shows "Error registering device"**

**Check the error details:**

```
❌ [DeviceManager] Error registering device: ...
```

**Common causes:**
- SQL function doesn't exist → Run `DEVICE_FIX_COMPLETE.sql`
- RLS policy blocking → SQL file fixes this
- Network error → Check Supabase connection

### **Problem: Devices show 📱 0/3 for everyone**

**Possible causes:**

1. **SQL not run** - Run `DEVICE_FIX_COMPLETE.sql`

2. **RPC function doesn't exist** - Check in Supabase:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'register_device_session';
   ```

3. **Login not calling device registration** - Check console logs

4. **User is super admin** - Super admins don't have tracked devices (this is correct!)

### **Problem: "function register_device_session does not exist"**

**Solution:** Run the SQL file! The function must be created.

---

## 📊 **How Device Tracking Works**

### **Flow Diagram:**

```
User Login
    ↓
registerCurrentDevice() called
    ↓
Check: Is super admin?
    ├─ YES → Skip (no limits)
    └─ NO → Continue
    ↓
Get Device ID (from localStorage)
    ↓
Call register_device_session RPC
    ↓
Database checks device count
    ├─ < 3 devices → Register new device ✅
    └─ ≥ 3 devices → Kick oldest, register new ⚠️
    ↓
Return success + device count
    ↓
Show in super admin dashboard 📱 X/3
```

### **Device Limit Rules:**

| User Type | Device Limit | Tracked? |
|-----------|--------------|----------|
| Business User | 3 devices | ✅ Yes |
| Super Admin | Unlimited | ❌ No (bypassed) |
| See-Through Session | Unlimited | ❌ No (bypassed) |

---

## 🔍 **Debug Commands**

### **Check if function exists:**

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'register_device_session';
```

Should return 1 row.

### **Check if table exists:**

```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'active_devices';
```

Should return 1 row.

### **Test the function manually:**

```sql
-- This will register a test device for the current logged-in user
SELECT register_device_session(
    'test-device-manual-' || gen_random_uuid()::text,
    'Test Device Manual',
    'Mozilla/5.0 Test',
    '127.0.0.1'
);
```

Should return:
```json
{"success": true, "action": "registered", "message": "Device registered successfully"}
```

### **Count devices per user:**

```sql
SELECT 
    p.email,
    COUNT(ad.id) FILTER (WHERE ad.is_active = true) as active_devices,
    COUNT(ad.id) as total_devices
FROM profiles p
LEFT JOIN active_devices ad ON p.id = ad.user_id
WHERE p.role = 'business_user'
GROUP BY p.id, p.email
ORDER BY active_devices DESC;
```

### **Clear all devices (for testing):**

```sql
DELETE FROM active_devices;
```

---

## ✅ **Verification Checklist**

- [ ] Ran `DEVICE_FIX_COMPLETE.sql` in Supabase
- [ ] Function `register_device_session` exists in database
- [ ] Table `active_devices` exists in database
- [ ] Console shows device registration logs when logging in
- [ ] Devices show up in database query
- [ ] Super admin dashboard shows device count (📱 X/3)
- [ ] Logging in from 4th device kicks oldest device
- [ ] Super admins don't have device tracking (correct behavior)

---

## 🎯 **Expected Behavior**

### **Regular Business User:**
1. Logs in → Device registered automatically
2. Shows as `📱 1/3` in super admin dashboard
3. Logs in from 2nd device → Shows `📱 2/3`
4. Logs in from 3rd device → Shows `📱 3/3`
5. Logs in from 4th device → Shows `📱 3/3` (oldest kicked)

### **Super Admin:**
1. Logs in → No device registration
2. Console shows: "🔑 Super admin - skipping device registration"
3. Dashboard shows nothing (or N/A) for devices
4. Can login from unlimited devices

---

## 📝 **Quick Test Script**

Open browser console and run:

```javascript
// Test device registration manually
const { registerCurrentDevice } = await import('/utils/deviceManager');
const result = await registerCurrentDevice();
console.log('Registration result:', result);
```

---

## 🚀 **After Running SQL:**

1. **Refresh the page** (Ctrl+R)
2. **Re-login** as a business user
3. **Check console** for device logs
4. **Check super admin dashboard** - should show device count!

**Device tracking should now work perfectly!** 🎉
