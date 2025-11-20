# 📱 Device Limit System - Complete Implementation Guide

## 🎯 Overview

This system limits the number of active devices per user with a **"Graceful Kick-Out"** strategy. When a user exceeds their device limit, the oldest session is automatically revoked, allowing the new device to log in.

## ✨ Features

- ✅ **Device Tracking**: Each device gets a persistent UUID stored in localStorage
- ✅ **Automatic Kick-Out**: Oldest device is logged out when limit is reached
- ✅ **Session Enforcement**: Periodic checks ensure revoked devices are logged out
- ✅ **Super Admin Dashboard**: Full device management and monitoring
- ✅ **Per-User Limits**: Customize device limits for each business user (1-10 devices)
- ✅ **Real-time Updates**: Device activity tracked and displayed
- ✅ **Force Logout**: Admins can manually revoke any device

---

## 🗂️ Architecture

### Database Tables

1. **`user_limits`** - Stores max device count per user (default: 3)
2. **`active_devices`** - Tracks all active sessions with metadata

### Key Functions

1. **`register_device_session()`** - Registers new device or updates existing
2. **`get_user_devices()`** - Retrieves all devices for a user
3. **`update_user_device_limit()`** - Admin function to change limits
4. **`revoke_device()`** - Admin function to force logout

---

## 🚀 Setup Instructions

### Step 1: Run Database Setup

1. Open your **Supabase SQL Editor**
2. Run the script: `scripts/device-limits-schema.sql`
3. This will create:
   - Tables with proper indexes
   - RLS policies for security
   - All required functions
   - Auto-trigger for new users

### Step 2: Verify Installation

All frontend code is already integrated:

- ✅ `utils/deviceManager.ts` - Device utility functions
- ✅ `pages/login.tsx` - Device registration on login
- ✅ `pages/_app.tsx` - Session enforcement
- ✅ `pages/super-admin.tsx` - Admin UI for device management
- ✅ `lib/supabase.ts` - TypeScript types

---

## 📖 How It Works

### User Login Flow

```
1. User enters credentials
2. Authentication succeeds
3. System gets/creates device ID from localStorage
4. Calls register_device_session()
   ├─ If device already exists → Update timestamp
   ├─ If under limit → Register new device
   └─ If at limit → Delete oldest + Register new
5. User sees notification if another device was kicked out
6. Redirect to dashboard
```

### Session Enforcement

```
Every 30 seconds + on route changes:
1. Check if current device exists in active_devices table
2. If NOT found → Device was revoked
   ├─ Sign out user
   └─ Redirect to login with error message
3. If found → Update last_active_at timestamp
```

### Admin Management

Super admins can:
- View device count for each user (e.g., "📱 2/3")
- Click to see detailed device list
- Change device limit (1-10)
- Revoke specific devices (force logout)

---

## 🎨 User Interface

### Login Page

Shows warnings when:
- Another device was kicked out during login
- User was logged out due to device limit

### Super Admin Dashboard

**Desktop View:**
- New "Devices" column showing: `📱 2/3` (active/limit)
- Click to open device management modal

**Mobile View:**
- Device count button under business name
- Tap to manage devices

**Device Management Modal:**
- Device limit control (1-10)
- List of all active devices with:
  - Device name/browser
  - Last active timestamp
  - Registration date
  - User agent info
  - Revoke button

---

## 🔧 Configuration

### Default Settings

```typescript
// Default device limit (set in database trigger)
DEFAULT_LIMIT = 3

// Session check interval (in _app.tsx)
CHECK_INTERVAL = 30000 // 30 seconds
```

### Changing Default Limit

Edit in `scripts/device-limits-schema.sql`:

```sql
-- Line in handle_new_user_limit() function
INSERT INTO public.user_limits (user_id, max_devices)
VALUES (new.id, 3); -- Change 3 to your desired default
```

### Per-User Limits

Admins can set custom limits (1-10) via:
1. Super Admin Dashboard
2. Click device count for a user
3. Change limit and click "Update Limit"

---

## 🧪 Testing Guide

### Test 1: Basic Device Limit

1. Set a user's device limit to **1**
2. Open Browser A → Log in ✅ Active
3. Open Browser B → Log in ✅ Active
4. Go back to Browser A → Refresh → ❌ Logged out

### Test 2: Device Registration

1. Log in on a device
2. Check Supabase `active_devices` table
3. Should see entry with:
   - Your user_id
   - Device name (e.g., "Chrome on Windows")
   - Timestamps

### Test 3: Manual Revoke

1. Admin opens device management for a user
2. Clicks "Revoke" on a device
3. User on that device:
   - Within 30 seconds → Auto logged out
   - Or on next page navigation → Logged out

### Test 4: Limit Update

1. Admin changes limit from 3 to 5
2. User can now have 5 active devices
3. Check `user_limits` table to verify

---

## 🔐 Security Features

### Row Level Security (RLS)

- ✅ Users can only view their own devices
- ✅ Only super admins can view all devices
- ✅ Only super admins can revoke devices
- ✅ Only super admins can update limits

### SECURITY DEFINER Functions

All RPC functions run with elevated privileges but:
- Check caller permissions
- Validate input parameters
- Enforce business rules

---

## 📊 Database Schema

### `user_limits` Table

```sql
user_id          uuid PRIMARY KEY
max_devices      integer NOT NULL (default 3)
created_at       timestamp
updated_at       timestamp
```

### `active_devices` Table

```sql
id                  uuid PRIMARY KEY
user_id             uuid FOREIGN KEY
device_identifier   text NOT NULL
device_name         text
user_agent          text
ip_address          text
last_active_at      timestamp
created_at          timestamp

UNIQUE(user_id, device_identifier)
```

---

## 🐛 Troubleshooting

### Issue: User not kicked out immediately

**Cause**: Session checks run every 30 seconds
**Solution**: This is by design. User will be logged out on next:
- Page navigation
- 30-second interval check

### Issue: Device limit not enforced

**Checks**:
1. Verify SQL script ran successfully
2. Check `user_limits` table has entry for user
3. Verify `register_device_session` function exists
4. Check browser console for errors

### Issue: Admin can't see devices

**Checks**:
1. Verify user has `role = 'super_admin'`
2. Check RLS policies are enabled
3. Verify `get_user_devices` function exists

### Issue: Device ID keeps changing

**Cause**: localStorage is being cleared
**Solution**: Device ID persists unless:
- Browser cache is cleared
- localStorage is manually cleared
- Private/incognito mode (each session = new ID)

---

## 📈 Monitoring

### Check Active Devices

```sql
-- See all active devices
SELECT * FROM active_devices
ORDER BY last_active_at DESC;

-- Count devices per user
SELECT user_id, COUNT(*) as device_count
FROM active_devices
GROUP BY user_id;

-- Find users over their limit
SELECT 
  ad.user_id,
  COUNT(*) as active_count,
  ul.max_devices
FROM active_devices ad
LEFT JOIN user_limits ul ON ul.user_id = ad.user_id
GROUP BY ad.user_id, ul.max_devices
HAVING COUNT(*) > COALESCE(ul.max_devices, 3);
```

### Check Device Limits

```sql
-- View all custom limits
SELECT 
  ul.user_id,
  p.full_name,
  p.email,
  ul.max_devices
FROM user_limits ul
JOIN profiles p ON p.id = ul.user_id
ORDER BY ul.max_devices DESC;
```

---

## 🔄 Maintenance

### Clean Up Old Devices

Devices are automatically removed when:
- User gets kicked out (limit reached)
- Admin revokes device
- User account is deleted (CASCADE)

### Manual Cleanup (if needed)

```sql
-- Remove devices inactive for 30+ days
DELETE FROM active_devices
WHERE last_active_at < NOW() - INTERVAL '30 days';
```

---

## 🎓 Best Practices

### For Administrators

1. **Set reasonable limits**: 3-5 devices is typical
2. **Monitor regularly**: Check for unusual device counts
3. **Communicate changes**: Notify users when changing limits
4. **Use revoke sparingly**: Only for security issues

### For Users

1. **Log out properly**: Prevents device accumulation
2. **Don't share accounts**: Each user should have own account
3. **Clear old devices**: Contact admin to remove unused devices

---

## 📞 Support

### Common Questions

**Q: What happens to my old device?**
A: It will be logged out automatically within 30 seconds or on next page load.

**Q: Can I see my active devices?**
A: Currently only admins can view devices. This can be extended to show users their own devices.

**Q: How do I log out a device remotely?**
A: Contact your administrator to revoke the device.

**Q: Why was I logged out?**
A: Either your device limit was reached, or an admin revoked your session.

---

## 🚨 Important Notes

1. **Private/Incognito Mode**: Each session is a separate "device"
2. **Browser Cache**: Clearing cache creates a new device ID
3. **Multiple Tabs**: Same browser = same device (shares localStorage)
4. **Mobile Apps**: Would need separate device tracking implementation

---

## 📝 Future Enhancements

Possible additions:
- [ ] User self-service device management page
- [ ] Email notifications when devices are revoked
- [ ] Device approval system (new device requires confirmation)
- [ ] Geolocation tracking for devices
- [ ] Device naming by users
- [ ] Last login IP address display
- [ ] Suspicious login alerts

---

## ✅ Verification Checklist

After setup, verify:

- [ ] SQL script executed without errors
- [ ] Tables `user_limits` and `active_devices` exist
- [ ] New users get default limit of 3
- [ ] Login registers device in database
- [ ] Super admin can see device counts
- [ ] Device management modal opens and loads devices
- [ ] Limit can be changed and updates successfully
- [ ] Revoking device logs out the user
- [ ] Exceeding limit kicks out oldest device
- [ ] Kicked-out device shows logout message

---

## 🎉 System Complete!

Your device limit system is fully operational. Users are protected from unauthorized access, and admins have full visibility and control over device sessions.

For support or questions, refer to the troubleshooting section or contact your development team.

---

**Last Updated**: November 2024
**Version**: 1.0.0
