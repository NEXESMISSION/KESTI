# Password Reset & See-Through Login Fixes

## ✅ Password Reset Feature - COMPLETED

### What Was Added:

1. **Forgot Password Page** (`/forgot-password`)
   - Users can request a password reset link
   - Email is sent via Supabase Auth
   - Clean UI with Arabic support

2. **Reset Password Page** (`/reset-password`)
   - Users are redirected here from the email link
   - Validates the session token
   - Allows setting a new password
   - Auto-redirects to login after success

3. **Login Page Update**
   - Added "نسيت كلمة المرور؟" link

### How It Works:

1. User clicks "نسيت كلمة المرور؟" on login page
2. User enters their email on `/forgot-password`
3. Supabase sends an email with a magic link
4. User clicks the link in email
5. User is redirected to `/reset-password` with session token
6. User enters new password
7. Password is updated and user is redirected to login

### Configuration Required:

#### Supabase Email Templates

You need to configure the email template in Supabase Dashboard:

1. Go to **Authentication > Email Templates**
2. Select **"Reset Password"** template
3. Update the **Redirect URL** to:
   ```
   {{ .SiteURL }}/reset-password
   ```

4. Make sure your Site URL is set correctly:
   - Go to **Authentication > URL Configuration**
   - Set **Site URL** to: `http://localhost:3000` (or your production URL)
   - Add **Redirect URLs**:
     - `http://localhost:3000/reset-password`
     - `http://localhost:3000/**` (for development)

#### Example Email Template:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

The `{{ .ConfirmationURL }}` will automatically include the tokens needed for `/reset-password` to work.

---

## 🔧 See-Through Login Fix - IN PROGRESS

### Current Issue:
The see-through login is failing because extracting session tokens from Supabase's admin API is version-dependent.

### What Was Changed:

1. **Updated API endpoint** (`/api/admin-create-session`)
   - Changed from `magiclink` to `recovery` type
   - Added multiple fallback methods for token extraction
   - Better error logging

2. **Token Extraction Methods:**
   - Try hash parameters first (`#access_token=...`)
   - Try query parameters
   - Try `hashed_token` property
   - Detailed error messages for debugging

### Testing the Fix:

1. Check your server console logs when clicking "See Through"
2. Look for the log: `Session data: {...}`
3. This will show the actual structure returned by Supabase

### Alternative Solution (If Recovery Links Don't Work):

If the see-through login still fails, you may need to use a different approach. Here are two alternatives:

#### Option 1: Direct Password Login (Simple but requires knowing passwords)

Create a simple form where admin enters the business user's password to log in as them.

#### Option 2: Temporary Password Generation

Have the admin API temporarily set a known password, log in with it, then restore the original password hash.

#### Option 3: Use Supabase Service Role Directly

Instead of generating magic links, directly create a session using the service role key:

```typescript
// In the API endpoint
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: authUser.user.email,
  email_confirm: true
})

// Then use impersonation (if supported by your Supabase version)
```

### Recommended Next Steps:

1. **Check Supabase Version**
   ```bash
   npm list @supabase/supabase-js
   ```

2. **Check API Logs**
   - Click "See Through" button
   - Check browser console
   - Check terminal/server logs
   - Look for the `Session data:` log

3. **Verify Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Test Recovery Link Manually**
   - Use Supabase dashboard to send a password reset email
   - Check the URL structure in the email
   - See where the tokens are (hash vs query params)

---

## 📋 Files Created/Modified

### Password Reset:
- ✅ `pages/forgot-password.tsx` (NEW)
- ✅ `pages/reset-password.tsx` (NEW)
- ✅ `pages/login.tsx` (MODIFIED - added forgot password link)

### See-Through Login:
- ✅ `pages/api/admin-create-session.ts` (MODIFIED - better token extraction)
- ✅ `pages/super-admin.tsx` (MODIFIED - added see-through button)
- ✅ `utils/deviceManager.ts` (MODIFIED - device limit bypass)

---

## 🧪 Testing Checklist

### Password Reset:
- [ ] Click "نسيت كلمة المرور؟" on login page
- [ ] Enter email and submit
- [ ] Check email inbox (and spam folder)
- [ ] Click the link in email
- [ ] Verify redirect to `/reset-password`
- [ ] Enter new password
- [ ] Verify success message
- [ ] Verify redirect to login
- [ ] Login with new password

### See-Through Login:
- [ ] Log in as super admin
- [ ] Go to super admin dashboard
- [ ] Click "👁️ See Through" on a business user
- [ ] Check browser console for errors
- [ ] Check server terminal for logs
- [ ] If successful: verify redirect to POS
- [ ] Verify device limit is not affected
- [ ] Logout and verify return to admin

---

## ⚠️ Common Issues & Solutions

### Issue: "Email not sent"
**Solution:** Check Supabase email settings. For development, you might need to use SMTP or enable test emails.

### Issue: "Invalid redirect URL"
**Solution:** Add the redirect URL to Supabase Auth settings under "Redirect URLs"

### Issue: "Token expired"
**Solution:** Password reset links expire after 1 hour by default. Request a new link.

### Issue: "Failed to extract session tokens"
**Solutions:**
1. Check the server console logs
2. Verify your Supabase version
3. Try the alternative solutions mentioned above
4. Check if your service role key has the right permissions

### Issue: "See-through still counts as device"
**Solution:** Verify that `localStorage.getItem('admin_see_through')` returns `'true'` in browser console while in see-through mode.

---

## 📞 Support

If issues persist:

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard > Logs
   - Look for Auth events

2. **Enable Debug Mode:**
   - Add this to your `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_DEBUG=true
     ```

3. **Test With Supabase CLI:**
   ```bash
   supabase functions serve
   ```

---

## 🔐 Security Notes

1. **Service Role Key:**
   - Never expose this in client-side code
   - Only use in API routes
   - Keep it secure in environment variables

2. **Password Reset:**
   - Links expire after 1 hour
   - One-time use only
   - Requires email verification

3. **See-Through Mode:**
   - Only super admins can use it
   - All actions are real (not read-only)
   - Be careful when making changes

---

**Last Updated:** November 2024
**Version:** 1.1.0
