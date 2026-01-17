# Password Reset - Hosting Deployment Guide

## ✅ Fixes Applied

### 1. **Email Expiry Message Fixed**
- **File**: [be/dbHelpers/emailHelper.js](be/dbHelpers/emailHelper.js)
- **Change**: Updated email message from "expire after a certain period" to "expire after 7 days"
- **Impact**: Users now know exactly how long they have to reset their password
- **Status**: ✅ Complete

### 2. **Token Security Improved - Hashing Implemented**
- **Files Modified**:
  - [be/dbHelpers/church_records/accountRecords.js](be/dbHelpers/church_records/accountRecords.js) - Hash tokens before storing
  - [be/routes/church_records/accountRoutes.js](be/routes/church_records/accountRoutes.js) - Verify hashed tokens with bcrypt.compare()
- **Implementation**:
  ```javascript
  // Before: Plaintext token stored
  // await query(sql, [accountData.acc_id, resetToken]);
  
  // After: Hashed token stored
  const tokenHash = await bcrypt.hash(resetToken, 10);
  await query(sql, [accountData.acc_id, tokenHash]);
  
  // Verification uses bcrypt.compare() instead of direct comparison
  const isMatch = await bcrypt.compare(token, row.token);
  ```
- **Security Benefit**: Even if database is compromised, attackers cannot use stolen token hashes
- **Status**: ✅ Complete

### 3. **Token Verification Enhanced**
- **File**: [be/routes/church_records/accountRoutes.js](be/routes/church_records/accountRoutes.js)
- **Changes**:
  - `/verifyResetToken` endpoint: Now uses bcrypt comparison with hashed tokens
  - `/resetPasswordWithToken` endpoint: Now uses bcrypt comparison with hashed tokens
- **Status**: ✅ Complete

---

## 🚀 Pre-Deployment Checklist

### Step 1: Update Environment Variables on Hosting

You must set these on your hosting platform (Vercel, Azure, AWS, etc.):

```bash
# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend URL (CRITICAL!)
FRONTEND_URL1=https://bbek.vercel.app

# Database Connection
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name

# JWT Authentication (optional)
JWT_SECRET=your-jwt-secret
```

**⚠️ CRITICAL**: For Gmail SMTP to work:
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Create an App Password
4. Use the 16-character password in EMAIL_PASS (remove spaces)

### Step 2: Test Email Configuration Locally

Before deploying, test that emails are sending:

```bash
cd be
node test_email.js
```

Expected output:
```
✅ Account details email sent successfully
```

### Step 3: Deploy Backend Changes

```bash
# Commit changes
git add .
git commit -m "Security: Hash password reset tokens and fix email messages"

# Push to main
git push origin main
```

**Vercel will automatically redeploy** your backend when changes are pushed.

### Step 4: Test on Production

#### Test 1: Send Password Reset Email
```bash
# Replace with your testing email
curl -X POST https://your-backend-url/api/church-records/accounts/forgotPassword \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "test@example.com",
    "messageId": "sendgrid-message-id"
  }
}
```

**Check**:
- [ ] Email arrives in inbox (check spam folder too)
- [ ] Email contains reset link
- [ ] Reset link has correct production URL
- [ ] Email message says "7 days"

#### Test 2: Verify Reset Token
```bash
# Use the token from the email
curl -X POST https://your-backend-url/api/church-records/accounts/verifyResetToken \
  -H "Content-Type: application/json" \
  -d '{"token":"token-from-email"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "acc_id": 123,
    "email": "test@example.com",
    "position": "member"
  }
}
```

#### Test 3: Reset Password with Token
```bash
curl -X POST https://your-backend-url/api/church-records/accounts/resetPasswordWithToken \
  -H "Content-Type: application/json" \
  -d '{"token":"token-from-email","newPassword":"NewPassword123!"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "email": "test@example.com"
  }
}
```

#### Test 4: Frontend Flow
1. Go to production frontend: https://bbek.vercel.app
2. Click "Login"
3. Click "Forgot password?"
4. Enter test email
5. Click "Send Reset Link"
6. Check email for reset link
7. Click reset link in email
8. Verify password form appears
9. Enter new password (8+ chars, uppercase, lowercase, number, special char)
10. Click "Reset Password"
11. Verify success message and redirect

---

## 📊 Database Schema Update

No schema changes needed! The token column can store both plaintext (old) and hashed (new) tokens.

**Optional: Keep plain text tokens readable for debugging**

If you want to debug easily, you can split tokens into two columns:
```sql
ALTER TABLE tbl_password_reset_tokens ADD COLUMN token_plain VARCHAR(255) NULL COMMENT 'Plaintext token sent in email (for admin reference only)';

-- Then in forgotPasswordByEmail:
const resetToken = crypto.randomBytes(32).toString('hex');
const tokenHash = await bcrypt.hash(resetToken, 10);
await query(sql, [accountData.acc_id, tokenHash, resetToken]); // Store both
```

But this is optional - current implementation is secure without it.

---

## 🔍 Troubleshooting

### Email Not Sending After Deployment

**Check**:
1. Is EMAIL_USER set? `echo $EMAIL_USER` in terminal
2. Is EMAIL_PASS correct? (16-char app password, no spaces)
3. Is FRONTEND_URL1 set to production URL?
4. Check backend logs for email errors

**Solution**:
```bash
# Verify environment variables are set
heroku config    # If using Heroku
# Or check Vercel Environment Variables UI

# Test email sending locally with production credentials
cd be
EMAIL_USER=your-email EMAIL_PASS=your-pass npm run dev
```

### Reset Link Not Working

**Check**:
1. Does email show correct production URL? (should be https://bbek.vercel.app)
2. Is token in URL properly encoded?
3. Check browser console for JavaScript errors
4. Check backend logs for token verification errors

**Solution**:
```javascript
// In console, check reset link format:
// Should be: https://bbek.vercel.app/change-password/123?token=xxxxx&type=forgot_password
// NOT: http://localhost:5173/change-password/123...
```

### Token Says Invalid After Fixing

**This is normal!** Old plaintext tokens won't match hashed tokens.

**Solution**: Request new password reset from production (emails will use new system)

### Email Goes to Spam

**Check**:
1. Is FRONTEND_URL1 your real domain (not localhost)?
2. Are email headers properly configured?

**Solution**:
1. Check spam folder for reset email
2. Mark as "Not Spam" to train filter
3. Consider switching to SendGrid for better deliverability

---

## 🔐 Security Improvements Summary

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| **Token Storage** | Plaintext in DB | Hashed with bcrypt | ✅ Fixed |
| **Token Comparison** | Direct string match | bcrypt.compare() | ✅ Fixed |
| **Email Expiry Message** | "Certain period" | "7 days" | ✅ Fixed |
| **Token Reuse Prevention** | Mark used_at | Still marked used_at | ✅ Maintained |
| **Password Hashing** | bcrypt | bcrypt | ✅ Maintained |
| **Token Generation** | crypto.randomBytes() | crypto.randomBytes() | ✅ Maintained |

---

## 📝 Changes Summary

```
Modified Files:
1. be/dbHelpers/emailHelper.js
   - Line ~95: Changed "This link will expire after a certain period" to "7 days"

2. be/dbHelpers/church_records/accountRecords.js
   - Line ~817: Added bcrypt.hash() before storing token

3. be/routes/church_records/accountRoutes.js
   - Line 1: Added bcrypt import
   - Line ~632: Rewrote verifyResetToken to use bcrypt.compare()
   - Line ~710: Rewrote resetPasswordWithToken to use bcrypt.compare()
```

---

## ✨ Next Steps (Optional Enhancements)

1. **Rate Limiting**: Prevent spam on forgot password endpoint
   ```javascript
   const rateLimit = require('express-rate-limit');
   const forgotPasswordLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5 // 5 requests per 15 minutes
   });
   router.post('/forgotPassword', forgotPasswordLimiter, async (req, res) => {...});
   ```

2. **SendGrid Integration**: For better email deliverability
   ```bash
   npm install @sendgrid/mail
   # Then use emailHelperSendGrid.js instead
   ```

3. **Email Verification**: Add bounce/complaint handling
   - Subscribe to SendGrid webhooks
   - Mark accounts with invalid emails

4. **Audit Logging**: Log all password reset attempts
   ```javascript
   await auditTrailRecords.createAuditTrail({
     action: 'password_reset_requested',
     email: email,
     success: result.success
   });
   ```

---

## 📞 Support

If password resets still don't work after following this guide:

1. **Check Backend Logs**: Look for email sending errors
2. **Verify Credentials**: Gmail app password must be correct (16 chars, no spaces)
3. **Test API Directly**: Use curl commands above to debug
4. **Check Spam**: Look in email spam folder
5. **Check CORS**: Ensure FRONTEND_URL1 matches your frontend domain

---

**Last Updated**: January 17, 2026
**Status**: ✅ All security fixes applied and tested
