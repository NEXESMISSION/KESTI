# 🚀 Device Limit System - Quick Start

## Step 1: Run Database Script (5 minutes)

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the entire contents of: `scripts/device-limits-schema.sql`
4. Click **Run**
5. ✅ You should see: "Success. No rows returned"

## Step 2: Test the System (2 minutes)

### Test Device Registration

1. **Log in** to your app as any business user
2. Open Supabase Dashboard → **Table Editor** → `active_devices`
3. ✅ You should see a row with:
   - Your user_id
   - A device_identifier (UUID)
   - Device name (e.g., "Chrome on Windows")

### Test Device Limit

1. Go to **Super Admin Dashboard**
2. Find a business user
3. ✅ You should see device count: `📱 1/3`
4. Click on it to open device management modal
5. ✅ You should see the device you just logged in with

## Step 3: Try the Kick-Out Feature (3 minutes)

1. **Super Admin**: Set a user's device limit to **1**
2. **Browser A**: Log in as that user → ✅ Success
3. **Browser B**: Log in as the same user → ✅ Success, kicks out Browser A
4. **Browser A**: Refresh the page → ❌ Automatically logged out!

## Step 4: Admin Features

### Change Device Limit

1. Super Admin Dashboard → Click device count (e.g., `📱 2/3`)
2. Change limit from 3 to 5
3. Click "Update Limit"
4. ✅ Count updates to `📱 2/5`

### Revoke a Device

1. Open device management for a user
2. Click **Revoke** on any device
3. That device will be logged out within 30 seconds

---

## 🎯 Quick Reference

| Action | Location | Who Can Do It |
|--------|----------|---------------|
| View device count | Super Admin table | Super Admin |
| Manage devices | Click device count | Super Admin |
| Change limit | Device modal | Super Admin |
| Revoke device | Device modal | Super Admin |

---

## ⚙️ Default Settings

- **Default Limit**: 3 devices per user
- **Check Interval**: Every 30 seconds
- **Limit Range**: 1-10 devices

---

## 🐛 Quick Troubleshooting

### "Device count shows 0/3 but I just logged in"

**Fix**: Refresh the Super Admin page. Device counts update every 30 seconds.

### "I can't see the Devices column"

**Fix**: Make sure you're on desktop view. On mobile, device info appears under the business name.

### "User not kicked out immediately"

**Expected**: Kick-out happens within 30 seconds or on next page navigation.

---

## 📖 Full Documentation

For complete details, see: `DEVICE_LIMIT_SYSTEM.md`

---

## ✅ Success Indicators

After setup, you should have:

- [x] `user_limits` table created
- [x] `active_devices` table created
- [x] Device count visible in Super Admin dashboard
- [x] Device management modal opens when clicking count
- [x] Can change device limit
- [x] Can revoke devices
- [x] Login registers devices
- [x] Exceeding limit kicks out oldest device

---

**Ready to use! 🎉**

Your device limit system is now active and protecting your users.
