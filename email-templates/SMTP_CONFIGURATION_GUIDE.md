# 📧 SMTP Configuration Guide for KESTI Email Templates

## 🎨 Beautiful Email Templates Created

I've created 3 stunning, professional email templates in Arabic:

1. **✅ Magic Link (Sign In)** - `magic-link.html`
2. **🔑 Reset Password** - `reset-password.html`
3. **🎉 Confirm Signup** - `confirm-signup.html`

All templates feature:
- ✨ Modern, gradient designs
- 📱 Fully responsive (mobile-friendly)
- 🇹🇳 Arabic language (RTL)
- 🎨 Brand colors (Green #6fc605 & Blue #0063bd)
- 🔒 Security notices
- 📞 Contact information
- 🌟 Professional animations

---

## 📋 SMTP Configuration for Custom Domain (support@kestipro.com)

You'll use `support@kestipro.com` - much more professional! 🎯

### Prerequisites:

You need to know WHERE your domain email is hosted. Common options:
- **cPanel** (most common shared hosting)
- **Hostinger, OVH, 1&1, GoDaddy**
- **Google Workspace** (if you have business Gmail)
- **Outlook/Microsoft 365**
- **Cloudflare Email Routing** → Gmail
- **Custom mail server**

---

### Option 1: Using Your Web Hosting's SMTP (Most Common)

**If `kestipro.com` is hosted on cPanel or shared hosting:**

1. **Login to your hosting control panel** (cPanel/Plesk)
2. **Find the email account settings** for `support@kestipro.com`
3. **Look for "Email Accounts" or "Mail"**
4. **Find the SMTP settings** (usually shows):
   - Server: `mail.kestipro.com` or `kestipro.com`
   - Port: 587 or 465
   - Username: `support@kestipro.com`
   - Password: [Your email password]

### Fill Supabase SMTP Form:

```
📧 Sender email address:
support@kestipro.com

👤 Sender name:
KESTI Pro Support

🌐 Host:
mail.kestipro.com
(Or: kestipro.com or smtp.kestipro.com)
Check your hosting panel!

🔌 Port number:
587
(Or 465 for SSL - check your hosting)

⏱️ Minimum interval per user:
60
(seconds)

👤 Username:
support@kestipro.com
(Full email address)

🔑 Password:
[Your email password for support@kestipro.com]
```

---

### Option 2: If You Don't Have support@kestipro.com Set Up Yet

**Create the email first:**

1. Go to your hosting **cPanel** → **Email Accounts**
2. Click **Create Email Account**
3. Enter:
   - Email: `support`
   - Domain: `kestipro.com`
   - Password: [Strong password]
   - Quota: 500 MB or unlimited
4. Click **Create**
5. Then get the SMTP settings from the email account

---

### Option 3: Using Gmail to Send AS support@kestipro.com

**If you want Gmail to handle the sending but show as support@kestipro.com:**

This is a hybrid approach - still uses Gmail's reliable servers.

**Step A: Set up Email Forwarding**
1. Forward `support@kestipro.com` → `quikasalami@gmail.com`
2. In Gmail settings, add `support@kestipro.com` as "Send mail as"

**Step B: Configure SMTP**
```
📧 Sender email address:
support@kestipro.com

👤 Sender name:
KESTI Pro Support

🌐 Host:
smtp.gmail.com

🔌 Port number:
587

⏱️ Minimum interval per user:
60

👤 Username:
quikasalami@gmail.com
(Your actual Gmail)

🔑 Password:
[Gmail App Password - 16 characters]
(Generate from: https://myaccount.google.com/apppasswords)
```

**Note:** Recipients will see emails FROM `support@kestipro.com`, but it's sent via Gmail.

---

### Important Notes:
- ✅ **Custom domain = More professional**
- 🔒 **Use strong password for support@kestipro.com**
- 📧 Port 587 is recommended (TLS/STARTTLS)
- 🚫 Port 25 is blocked by most providers
- 💡 Test with a personal email first!

---

## 🚀 Alternative SMTP Providers (If Gmail Doesn't Work)

### Option 1: SendGrid (FREE - 100 emails/day)
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
```
Sign up: https://sendgrid.com/

### Option 2: Mailgun (FREE - 1000 emails/month)
```
Host: smtp.mailgun.org
Port: 587
Username: [Your Mailgun SMTP username]
Password: [Your Mailgun SMTP password]
```
Sign up: https://mailgun.com/

### Option 3: Sendinblue/Brevo (FREE - 300 emails/day)
```
Host: smtp-relay.sendinblue.com
Port: 587
Username: [Your Sendinblue email]
Password: [Your Sendinblue SMTP key]
```
Sign up: https://www.brevo.com/

---

## 📝 Upload Templates to Supabase

### Step 1: Go to Supabase Dashboard
1. Open your project: https://supabase.com/dashboard
2. Navigate to: **Authentication** → **Email Templates**

### Step 2: Update Each Template

#### 1. Magic Link Template:
- Click on **"Magic Link"**
- Copy content from `magic-link.html`
- Paste in the editor
- **Keep** `{{ .ConfirmationURL }}` placeholders
- Click **Save**

#### 2. Reset Password Template:
- Click on **"Reset Password" / "Change Email"**
- Copy content from `reset-password.html`
- Paste in the editor
- **Keep** `{{ .ConfirmationURL }}` placeholders
- Click **Save**

#### 3. Confirm Signup Template:
- Click on **"Confirm Signup"**
- Copy content from `confirm-signup.html`
- Paste in the editor
- **Keep** `{{ .ConfirmationURL }}` placeholders
- Click **Save**

---

## 🧪 Testing Your SMTP Configuration

### Test Steps:

1. **After configuring SMTP and saving:**
   - Go to your KESTI app
   - Try signing up with a new account
   - OR request a password reset

2. **Check your inbox:**
   - Look in your Gmail inbox
   - Check **Spam/Junk** folder if not in inbox
   - The email should look beautiful with the new template!

3. **Verify the email:**
   - Click the button in the email
   - Should redirect to your app
   - Account should be confirmed/password reset

### Common Issues:

❌ **"Authentication failed"**
- You're using regular password instead of App Password
- Solution: Generate App Password from Google Account

❌ **"Connection timeout"**
- Wrong port number
- Solution: Use port 587 or 465

❌ **Emails go to Spam**
- Normal for first few emails
- Solution: Add your domain to SPF/DKIM records (advanced)

❌ **Rate limit exceeded**
- Sending too many emails too fast
- Solution: Increase "Minimum interval per user"

---

## 🎨 Customizing Your Templates

### Colors:
The templates use your brand colors:
- **Primary Green:** `#6fc605`
- **Primary Blue:** `#0063bd`

To change colors, find and replace in the HTML:
```css
#6fc605  →  Your new green
#0063bd  →  Your new blue
```

### Logo:
Current: Text-based "KESTI"
To add image logo, replace:
```html
<div class="logo">KESTI</div>
```
With:
```html
<img src="https://your-domain.com/logo.png" alt="KESTI" style="height: 50px;">
```

### Contact Info:
Update in the footer section:
- Phone: `+216 53518337`
- Email: `support@kestipro.com`
- Facebook: Your Facebook URL
- Instagram: Your Instagram URL

---

## 🔒 Security Best Practices

1. **Never share your App Password**
2. **Don't commit SMTP credentials to Git**
3. **Use environment variables for sensitive data**
4. **Regularly rotate your App Password**
5. **Monitor email sending for suspicious activity**

---

## 📊 Email Sending Limits

### Gmail SMTP Limits:
- **500 emails/day** (for regular Gmail)
- **2000 emails/day** (for Google Workspace)
- Rate limit: ~100 emails per minute

### Supabase Limits:
- **Default:** 3-4 emails per hour (very low!)
- **With SMTP:** 30 emails per hour (or provider limit)
- Can be increased in settings

---

## ✅ Final Checklist

Before going live:

- [ ] Generated Gmail App Password
- [ ] Configured SMTP in Supabase
- [ ] Uploaded all 3 email templates
- [ ] Tested signup email
- [ ] Tested password reset email
- [ ] Tested magic link email
- [ ] Emails look good on mobile
- [ ] Emails not going to spam
- [ ] All links work correctly
- [ ] Contact info is correct

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Supabase Logs:**
   - Dashboard → Logs → Auth logs
   - Look for email sending errors

2. **Test SMTP credentials:**
   - Use online SMTP testers
   - https://www.smtper.net/

3. **Verify Gmail settings:**
   - 2FA is enabled
   - App Password is correct
   - "Less secure apps" is NOT needed (outdated)

4. **Contact support:**
   - Supabase: https://supabase.com/support
   - KESTI: support@kestipro.com

---

## 📧 Example Filled Form

Here's exactly what your form should look like:

### If using your own hosting (Option 1):
```
┌─────────────────────────────────────────────┐
│ Enable custom SMTP                          │
├─────────────────────────────────────────────┤
│ Sender email address                        │
│ support@kestipro.com                        │
├─────────────────────────────────────────────┤
│ Sender name                                 │
│ KESTI Pro Support                           │
├─────────────────────────────────────────────┤
│ Host                                        │
│ mail.kestipro.com                           │
├─────────────────────────────────────────────┤
│ Port number                                 │
│ 587                                         │
├─────────────────────────────────────────────┤
│ Minimum interval per user                   │
│ 60                          seconds         │
├─────────────────────────────────────────────┤
│ Username                                    │
│ support@kestipro.com                        │
├─────────────────────────────────────────────┤
│ Password                                    │
│ [Your email password]                       │
└─────────────────────────────────────────────┘

        [Cancel]  [Save changes]
```

### If using Gmail (Option 3):
```
┌─────────────────────────────────────────────┐
│ Enable custom SMTP                          │
├─────────────────────────────────────────────┤
│ Sender email address                        │
│ support@kestipro.com                        │
├─────────────────────────────────────────────┤
│ Sender name                                 │
│ KESTI Pro Support                           │
├─────────────────────────────────────────────┤
│ Host                                        │
│ smtp.gmail.com                              │
├─────────────────────────────────────────────┤
│ Port number                                 │
│ 587                                         │
├─────────────────────────────────────────────┤
│ Minimum interval per user                   │
│ 60                          seconds         │
├─────────────────────────────────────────────┤
│ Username                                    │
│ quikasalami@gmail.com                       │
├─────────────────────────────────────────────┤
│ Password                                    │
│ abcd efgh ijkl mnop (16-char App Password)  │
└─────────────────────────────────────────────┘

        [Cancel]  [Save changes]
```

---

**🎉 That's it! Your beautiful email system is ready!**

Once configured, users will receive stunning, professional emails that make KESTI look like a premium product! 🚀

---

**Last Updated:** November 28, 2024
**Version:** 1.0.0
