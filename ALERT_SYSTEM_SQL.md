# Alert System SQL Migration

Run this SQL in your Supabase SQL Editor to add the required columns for the alert system and welcome modal fix.

## Add Required Columns

```sql
-- Add welcome_shown column to track if user has seen welcome modal
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS welcome_shown BOOLEAN DEFAULT FALSE;

-- Add pending_alert_message column for super-admin alerts
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pending_alert_message TEXT DEFAULT NULL;

-- Update existing users to have welcome_shown = false (they'll see welcome once)
-- If you want existing users to NOT see the welcome modal, set to true:
-- UPDATE profiles SET welcome_shown = true WHERE role = 'business_user';
```

## What This Does

1. **`welcome_shown`** - Tracks whether a user has seen the welcome modal. Set to `true` after showing once. Survives logout/login and device changes.

2. **`pending_alert_message`** - Stores alert messages from super-admin. When not null, shows a popup to the business owner on the admin dashboard. Cleared after showing.

## How It Works

### Welcome Modal
- Only shows ONCE when user first logs in (during trial period)
- Stored in database, not localStorage
- Won't show again even after logout/login

### Alert System
- Super-admin clicks "📢 Alert" button on a business
- Enters a message (Arabic recommended)
- Business owner sees popup when entering admin dashboard (after PIN)
- Message shows only once, then auto-clears
