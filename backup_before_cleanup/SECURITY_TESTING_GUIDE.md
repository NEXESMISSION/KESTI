# 🔍 Security Testing & Penetration Testing Guide

**KESTI POS Web Application**  
**Last Updated:** December 4, 2025

---

## 📋 Pre-Testing Checklist

Before conducting security tests, ensure:
- [ ] You have authorization to test
- [ ] Tests are conducted in staging/dev environment
- [ ] Backups are in place
- [ ] Team is notified of testing schedule

---

## 1. 🔐 Authentication Testing

### Test Cases:

#### A. Password Policy Testing
```bash
# Test weak passwords
✗ password123
✗ 12345678
✗ qwerty
✓ StrongP@ss2024!

# Requirements to verify:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Maximum 72 characters
- Not in common password list
```

#### B. Brute Force Protection
```bash
# Test failed login attempts
1. Try 5+ failed logins with same email
2. Verify account gets temporarily locked
3. Check if rate limiting triggers (429 response)
4. Verify IP-based rate limiting works
```

#### C. Session Management
```bash
# Test session security
1. Login and capture session token
2. Try to use token after logout (should fail)
3. Check token expiry time (should be short)
4. Verify session regeneration on login
5. Test concurrent sessions on multiple devices
```

---

## 2. 🚫 XSS (Cross-Site Scripting) Testing

### Test Vectors:

```javascript
// Test in all input fields:

1. Basic XSS
<script>alert('XSS')</script>

2. Event Handler
<img src=x onerror=alert('XSS')>

3. SVG XSS
<svg/onload=alert('XSS')>

4. Encoded XSS
&#60;script&#62;alert('XSS')&#60;/script&#62;

5. JavaScript URL
<a href="javascript:alert('XSS')">Click</a>

6. Form Input XSS
"><script>alert(String.fromCharCode(88,83,83))</script>
```

### Fields to Test:
- [ ] Business name input
- [ ] Product name/description
- [ ] Customer name
- [ ] Comments/notes fields
- [ ] Search functionality
- [ ] URL parameters

### Expected Result:
✅ All inputs should be sanitized
✅ No script execution
✅ HTML entities properly escaped

---

## 3. 🔐 CSRF (Cross-Site Request Forgery) Testing

### Test Procedure:

```html
<!-- Create test HTML file and open in browser while logged in -->
<html>
  <body>
    <form action="https://yourapp.com/api/delete-business" method="POST">
      <input type="hidden" name="userId" value="target-user-id">
    </form>
    <script>
      document.forms[0].submit();
    </script>
  </body>
</html>
```

### Verify:
- [ ] Request fails without proper authentication
- [ ] SameSite=strict cookies prevent CSRF
- [ ] Origin/Referer headers are checked
- [ ] API requires Bearer token (not just cookies)

---

## 4. 💉 SQL Injection Testing

### Test Vectors:

```sql
-- Test in all inputs that query database:

1. Basic injection
' OR '1'='1
admin'--
' OR 1=1--

2. Union-based
' UNION SELECT null, username, password FROM users--

3. Time-based blind
' AND SLEEP(5)--
'; WAITFOR DELAY '00:00:05'--

4. Boolean-based
' AND 1=1--
' AND 1=2--

5. Stacked queries
'; DROP TABLE users--
```

### Test Locations:
- [ ] Login form (email/password)
- [ ] Search fields
- [ ] URL parameters (?id=123)
- [ ] Product filters
- [ ] Customer lookup

### Expected Result:
✅ All queries use parameterized statements
✅ No error messages revealing database structure
✅ Input validation rejects special characters

---

## 5. 🔑 Authorization & Access Control Testing

### Test Scenarios:

#### A. Horizontal Privilege Escalation (IDOR)
```bash
# Test accessing other users' data:

1. Login as User A (get user_id: abc123)
2. Try to access User B's data:
   GET /api/products?owner_id=xyz789
   GET /api/sales?owner_id=xyz789

Expected: ❌ Access denied
```

#### B. Vertical Privilege Escalation
```bash
# Test business user accessing admin functions:

1. Login as business_user
2. Try admin endpoints:
   POST /api/create-business
   POST /api/delete-business
   POST /api/clear-history

Expected: ❌ 403 Forbidden
```

#### C. Missing Function Level Access Control
```bash
# Test direct API access without authentication:

curl -X POST https://yourapp.com/api/create-business \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com",...}'

Expected: ❌ 401 Unauthorized
```

---

## 6. 📦 API Security Testing

### Rate Limiting Tests:

```bash
# Test rate limits on each endpoint:

# Standard endpoints (10 req/min)
for i in {1..15}; do
  curl -X POST https://yourapp.com/api/endpoint
done

# Password endpoints (5 req/min)
for i in {1..10}; do
  curl -X POST https://yourapp.com/api/update-password
done

Expected: 429 Too Many Requests after threshold
```

### Request Size Testing:

```bash
# Test max body size (50MB limit)
dd if=/dev/zero of=test.dat bs=1M count=60
curl -X POST https://yourapp.com/api/endpoint \
  -H "Content-Type: application/json" \
  -d @test.dat

Expected: 413 Payload Too Large
```

### HTTP Method Testing:

```bash
# Test unused methods are blocked:
curl -X PUT https://yourapp.com/api/endpoint
curl -X DELETE https://yourapp.com/api/endpoint
curl -X PATCH https://yourapp.com/api/endpoint

Expected: 405 Method Not Allowed
```

---

## 7. 📁 File Upload Security Testing

### Test Cases:

```bash
# 1. Upload executable files
test.exe, test.php, test.jsp, test.aspx

# 2. Double extension bypass
image.jpg.php, file.png.exe

# 3. MIME type manipulation
(PNG with .exe extension)

# 4. Large file upload
file_100MB.jpg

# 5. SVG with embedded script
<svg><script>alert('XSS')</script></svg>

# 6. Path traversal in filename
../../etc/passwd.jpg
```

### Expected Results:
- [ ] Only allowed extensions (.jpg, .png, .webp)
- [ ] Files renamed to random names
- [ ] Max size enforced (5MB default)
- [ ] MIME type validated
- [ ] Files stored outside public directory
- [ ] No script execution from uploaded files

---

## 8. 🔍 Business Logic Testing

### Duplicate Submission Prevention:

```javascript
// Test rapid form submission:
const button = document.querySelector('form button');
for(let i = 0; i < 10; i++) {
  button.click();
}

Expected: Only 1 submission processed
```

### Price Manipulation:

```javascript
// Test negative prices in console:
fetch('/api/create-product', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'Test',
    price: -100, // Negative price
    quantity: 999999 // Unrealistic quantity
  })
});

Expected: ❌ Validation error
```

### Transaction Validation:

```javascript
// Test total mismatch:
{
  "items": [
    {"price": 10, "quantity": 2} // Should be 20
  ],
  "total": 100 // Wrong total
}

Expected: ❌ Transaction total mismatch error
```

---

## 9. 🌐 Network Security Testing

### SSL/TLS Testing:

```bash
# Check SSL configuration:
openssl s_client -connect yourapp.com:443

# Test weak ciphers:
nmap --script ssl-enum-ciphers -p 443 yourapp.com

# Verify HSTS:
curl -I https://yourapp.com | grep -i strict-transport-security
```

### Security Headers Testing:

```bash
# Check all security headers:
curl -I https://yourapp.com

Expected headers:
✓ Strict-Transport-Security: max-age=63072000
✓ X-Content-Type-Options: nosniff
✓ X-Frame-Options: SAMEORIGIN
✓ X-XSS-Protection: 1; mode=block
✓ Content-Security-Policy: ...
✓ Referrer-Policy: strict-origin-when-cross-origin
```

---

## 10. 🔄 Session & Cookie Testing

### Cookie Security:

```javascript
// Check cookie attributes in browser console:
document.cookie

Expected attributes:
✓ HttpOnly (prevents JavaScript access)
✓ Secure (HTTPS only)
✓ SameSite=Strict (CSRF protection)
```

### Session Fixation:

```bash
1. Get session token before login
2. Login with credentials
3. Check if session token changed

Expected: ✅ New token generated
```

---

## 11. 📊 Monitoring & Logging Tests

### Verify Logging:

```bash
# Check if these events are logged:
- [ ] Successful logins
- [ ] Failed login attempts
- [ ] Password changes
- [ ] Account creations/deletions
- [ ] Device registrations
- [ ] Suspicious activities
- [ ] Rate limit violations
```

### Test Log Security:

```bash
# Verify logs don't contain:
❌ Plain text passwords
❌ Full credit card numbers
❌ API keys/secrets
❌ Session tokens
```

---

## 12. 🚀 Automated Security Scanning

### Tools to Use:

#### A. OWASP ZAP
```bash
# Automated security scan:
zap-cli quick-scan --spider https://yourapp.com
zap-cli active-scan https://yourapp.com
```

#### B. Nikto
```bash
# Web server vulnerability scan:
nikto -h https://yourapp.com
```

#### C. npm audit
```bash
# Check for vulnerable dependencies:
npm audit
npm audit fix
```

#### D. Snyk
```bash
# Advanced dependency scanning:
npx snyk test
```

---

## 13. 🔐 Penetration Testing Checklist

### Critical Tests:

- [ ] **Authentication Bypass** - Try accessing protected pages without login
- [ ] **Session Hijacking** - Steal and use another user's session
- [ ] **IDOR** - Access other users' resources by ID manipulation
- [ ] **Mass Assignment** - Send unexpected fields in API requests
- [ ] **XXE** - XML External Entity injection (if XML parsing exists)
- [ ] **SSRF** - Server-Side Request Forgery via URLs
- [ ] **Directory Traversal** - Access files outside web root
- [ ] **Command Injection** - Execute system commands via inputs
- [ ] **Open Redirect** - Redirect users to malicious sites
- [ ] **Race Conditions** - Concurrent requests to exploit timing

---

## 14. 📝 Security Testing Report Template

```markdown
## Security Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]

### Executive Summary
[Brief overview of findings]

### Critical Vulnerabilities (P0)
- None found ✅ / [List vulnerabilities]

### High Vulnerabilities (P1)
- [List with severity and impact]

### Medium Vulnerabilities (P2)
- [List with recommendations]

### Low Vulnerabilities (P3)
- [List for future improvements]

### Tests Passed
- [List all successful security tests]

### Recommendations
1. [Priority fixes]
2. [Improvements]
3. [Future enhancements]
```

---

## 15. 🛡️ Continuous Security Testing

### Daily:
- [ ] Monitor error logs for anomalies
- [ ] Check failed login attempts
- [ ] Review rate limit violations

### Weekly:
- [ ] Run `npm audit`
- [ ] Check for dependency updates
- [ ] Review security logs

### Monthly:
- [ ] Full automated security scan (OWASP ZAP)
- [ ] Manual penetration testing
- [ ] Review and update security policies

### Quarterly:
- [ ] Professional security audit
- [ ] Rotate API keys and secrets
- [ ] Update security documentation

---

## 🎯 Test Completion Checklist

After completing all tests, verify:

- [ ] All authentication tests passed
- [ ] No XSS vulnerabilities found
- [ ] CSRF protection working
- [ ] No SQL injection possible
- [ ] Authorization properly enforced
- [ ] Rate limiting functional
- [ ] File uploads secure
- [ ] Business logic validated
- [ ] Security headers present
- [ ] Cookies properly configured
- [ ] Logging comprehensive
- [ ] No critical vulnerabilities
- [ ] Report generated
- [ ] Fixes documented

---

## 📞 Security Incident Response

If you find a critical vulnerability:

1. **DO NOT** exploit it in production
2. Document the issue immediately
3. Notify the development team
4. Create a fix in staging first
5. Test the fix thoroughly
6. Deploy to production ASAP
7. Monitor for similar issues

---

**Remember:** Security is an ongoing process, not a one-time task. Regular testing and updates are essential.

---

*For questions or to report security issues, contact: security@kestipro.com*
