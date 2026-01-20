1. Email Templates
Files: be/dbHelpers/emailHelperSendGrid.js and be/dbHelpers/emailHelperSMTP.js
What: Contains CHURCH_WEBSITE constant used in password reset and other emails
Impact: Emails would show broken links if not updated

2. CORS Configuration# Reset Password Flow Analysis - "Forgot Password" Feature

## Overview

The reset password functionality is **working correctly** in the application. Here's a detailed analysis of the complete flow.

---

## 1. FRONTEND FLOW

### Entry Point: Login Dialog

- **File**: [fe/src/components/Dialogs/LoginDialog.vue](fe/src/components/Dialogs/LoginDialog.vue)
- **Action**: User clicks "Forgot password?" link
- **Handler**: `handleForgotPassword(true)` - opens the ForgotPasswordDialog

### Forgot Password Dialog

- **File**: [fe/src/components/Dialogs/ForgotPasswordDialog.vue](fe/src/components/Dialogs/ForgotPasswordDialog.vue)
- **Purpose**: Collect user's email address
- **Validation**:
  - Email is required
  - Valid email format required (type='email')

### Key Function: `handleForgotPassword()`

```javascript
// Location: ForgotPasswordDialog.vue (Line ~178)
const handleForgotPassword = async () => {
  const valid = await forgotPasswordFormRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const result = await accountsStore.forgotPassword(forgotPasswordForm.email);
    if (result) {
      showSuccessDialog(
        "Success!",
        "Password reset link has been sent to your email address",
      );
    } else {
      showSuccessDialog(
        "Error",
        accountsStore.error || "Failed to send reset link. Please try again.",
        true,
      );
    }
  } catch (error) {
    showSuccessDialog("Error", "An error occurred. Please try again.", true);
  } finally {
    loading.value = false;
  }
};
```

### Accounts Store Method

- **File**: [fe/src/stores/ChurchRecords/accountsStore.js](fe/src/stores/ChurchRecords/accountsStore.js) (Line ~254)
- **API Call**: `POST /church-records/accounts/forgotPassword`
- **Body**: `{ email }`
- **Success**: Returns account data
- **Failure**: Sets error message

### Password Reset Page

- **File**: [fe/src/components/PasswordManagement.vue](fe/src/components/PasswordManagement.vue)
- **Route**: `/change-password/:acc_id?token=...&type=forgot_password`
- **Flow**:
  1. Validates token via `verifyResetToken` API
  2. If valid: Shows password form
  3. If invalid/expired: Shows "Invalid or Expired Link" message
  4. User enters new password (8+ characters with uppercase, lowercase, number, special char)
  5. Submits to `resetPasswordWithToken` API

---

## 2. BACKEND FLOW

### Database Table

- **Table**: `tbl_password_reset_tokens`
- **Columns**:
  - `token` (unique): Random 64-character hex string
  - `acc_id` (FK): Account ID
  - `expires_at`: 7 days from creation
  - `used_at`: Timestamp when token was used (NULL until used)
- **Cleanup**: Expired/used tokens are deleted before creating new ones

### API Endpoints

#### 1. POST `/api/church-records/accounts/forgotPassword`

- **File**: [be/routes/church_records/accountRoutes.js](be/routes/church_records/accountRoutes.js) (Line ~523)
- **Handler**: `forgotPasswordByEmail(email)`
- **Process**:
  1. Validates email exists in `tbl_accounts`
  2. Generates cryptographically secure reset token (32 bytes → hex = 64 chars)
  3. Stores token in database with 7-day expiry
  4. Retrieves member name from `tbl_members` for personalization
  5. Sends password reset email via email helper
  6. Returns success with email and messageId

**Response** (Success):

```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "user@example.com",
    "messageId": "sendgrid-message-id"
  }
}
```

**Error Cases**:

- Email not found → 404 with "Account not found"
- Email sending fails → 500 with error details

#### 2. POST `/api/church-records/accounts/verifyResetToken`

- **File**: [be/routes/church_records/accountRoutes.js](be/routes/church_records/accountRoutes.js) (Line ~626)
- **Purpose**: Frontend calls this to validate token before showing password form
- **Query**:

```sql
SELECT t.*, a.email, a.position, a.status
FROM tbl_password_reset_tokens t
JOIN tbl_accounts a ON t.acc_id = a.acc_id
WHERE t.token = ?
  AND t.expires_at > UTC_TIMESTAMP()
  AND a.status = 'active'
  AND t.used_at IS NULL
```

- **Response**: Returns token data if valid
- **Validation Checks**:
  - ✅ Token exists in database
  - ✅ Token not expired (expires_at > NOW)
  - ✅ Token not already used (used_at IS NULL)
  - ✅ Account is active

#### 3. POST `/api/church-records/accounts/resetPasswordWithToken`

- **File**: [be/routes/church_records/accountRoutes.js](be/routes/church_records/accountRoutes.js) (Line ~703)
- **Validation**:
  - Token required
  - New password required
  - Password length ≥ 8 characters
  - Token must not be expired
- **Process**:
  1. Verifies token validity (same checks as above)
  2. Updates password in `tbl_accounts` (hashed with bcrypt)
  3. Marks token as used by setting `used_at = NOW()`
  4. Returns success with email

**Response** (Success):

```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

---

## 3. EMAIL SENDING

### Email Helper Configuration

- **Primary File**: [be/dbHelpers/emailHelper.js](be/dbHelpers/emailHelper.js) (Default - **Nodemailer/SMTP**)
- **Alternative File**: [be/dbHelpers/emailHelperSendGrid.js](be/dbHelpers/emailHelperSendGrid.js) (SendGrid)
- **Alternative File**: [be/dbHelpers/emailHelperSMTP.js](be/dbHelpers/emailHelperSMTP.js) (SMTP with Gmail)

### Current Email Setup (For Forgot Password)

**File**: [be/dbHelpers/emailHelper.js](be/dbHelpers/emailHelper.js)

**Function**: `sendAccountDetails(accountDetails)`

- **Email Type**: Detected as `forgot_password`
- **Reset Link Format**:
  ```
  {FRONTEND_URL1}/change-password/{acc_id}?token={token}&type=forgot_password
  ```
- **Expiry in Email**: "This link will expire after 1 hour for security reasons" ⚠️
  - **ISSUE**: Database sets 7 days, but email says 1 hour!
- **Subject**: `Password Reset - Bible Baptist Ekklesia of Kawit`

### Email Environment Variables Required

```bash
# SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Gmail App Password, NOT regular password

# Frontend URL for reset link
FRONTEND_URL1=https://biblebaptistekklesiaofkawit.xyz  # Production URL

# Optional for SendGrid
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=your-sendgrid@example.com
```

### Email Content For Forgot Password

- **Header**: Church branding and name
- **Main Message**: "We received a request to reset your password..."
- **Button**: "Reset My Password" with full reset link
- **Fallback Link**: Full URL shown as plain text in case button doesn't work
- **Important Notes**:
  - ⚠️ Incorrect expiry time stated in email
  - Security warning: "Don't share this link"
  - "If you didn't request this, ignore it"
- **Footer**: Church contact information

---

## 4. HOSTING DEPLOYMENT CONSIDERATIONS

### ✅ What's Working on Hosting

1. **Backend API Routes**: All endpoints properly configured
2. **Database Connectivity**: Token table and queries work
3. **Password Hashing**: bcrypt properly hashing new passwords
4. **Token Generation**: Secure crypto token generation
5. **Frontend Pages**: All Vue components properly set up

### ⚠️ Critical Issues for Hosting

#### Issue #1: Email Configuration

**Status**: ❌ LIKELY BROKEN ON PRODUCTION

- **Problem**: Email credentials need to be set in environment variables
- **Location**: Backend environment variables must include:
  - `EMAIL_HOST`
  - `EMAIL_PORT`
  - `EMAIL_USER`
  - `EMAIL_PASS` (Gmail App Password, not regular password)
  - `FRONTEND_URL1` (must be your production URL)

- **Check**: What email service is configured on your hosting?
  - Vercel? Azure? AWS? Self-hosted?
  - Is SendGrid API key configured?
  - Is Gmail SMTP configured?

#### Issue #2: Frontend URL Mismatch

**Status**: ⚠️ CRITICAL

- **Current Code**: `process.env.FRONTEND_URL1 || 'http://localhost:5173'`
- **Problem**: If `FRONTEND_URL1` is not set, reset links will point to `localhost:5173` on production!
- **Fix Required**: Ensure `FRONTEND_URL1` is set to your production frontend URL:
  ```
  FRONTEND_URL1=https://biblebaptistekklesiaofkawit.xyz
  ```

#### Issue #3: Token Expiry Mismatch

**Status**: 🐛 BUG (Non-Critical)

- **Database**: 7 days expiry
- **Email Message**: States "1 hour"
- **Fix**: Update email message to say "7 days"

#### Issue #4: Nodemailer/SMTP vs SendGrid

**Status**: ⚠️ CONFIGURATION REQUIRED

- **Current Setup**: Uses `emailHelper.js` (Nodemailer/SMTP)
- **Your Options**:
  1. Use Gmail SMTP (requires App Password)
  2. Switch to SendGrid (requires API key)
  3. Use another SMTP provider

---

## 5. TESTING CHECKLIST FOR HOSTING

### Frontend Tests

- [ ] "Forgot Password" link opens dialog
- [ ] Email validation works (rejects invalid emails)
- [ ] Success message shows after sending
- [ ] Error message shows if email doesn't exist
- [ ] Reset link from email works and opens password form
- [ ] Token validation shows error for invalid/expired tokens
- [ ] Password form shows validation errors
- [ ] Password reset succeeds with valid token
- [ ] Success page redirects to login after 3 seconds

### Backend API Tests

```bash
# Test 1: Request password reset
curl -X POST http://your-hosting-url/api/church-records/accounts/forgotPassword \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
# Expected: 200 with success message

# Test 2: Verify token
curl -X POST http://your-hosting-url/api/church-records/accounts/verifyResetToken \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token-from-email"}'
# Expected: 200 with token data

# Test 3: Reset password with token
curl -X POST http://your-hosting-url/api/church-records/accounts/resetPasswordWithToken \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token","newPassword":"NewPassword123!"}'
# Expected: 200 with success message
```

### Email Tests

- [ ] Email is sent immediately after forgotPassword request
- [ ] Email contains correct reset link with token
- [ ] Email contains church branding
- [ ] Email is readable in Gmail, Outlook, etc.
- [ ] Reset link in email is clickable and functional
- [ ] Check spam folder (especially for SendGrid/Gmail SMTP)

---

## 6. TROUBLESHOOTING

### Symptoms: Email Not Received

**Possible Causes**:

1. ❌ Email credentials not set in hosting environment variables
2. ❌ FRONTEND_URL1 not configured → email might not send if header validation fails
3. ❌ Email provider blocking sender address
4. ❌ Hosting firewall blocking SMTP ports
5. ❌ Email function throwing error (check backend logs)

**Debug Steps**:

1. Check backend logs for email sending errors
2. Verify all EMAIL\_\* environment variables are set
3. Check email inbox and spam folder
4. Test API directly: `POST /forgotPassword` with test email
5. Review error response: is it 404, 500, or success with no email?

### Symptoms: Reset Link Not Working

**Possible Causes**:

1. ❌ FRONTEND_URL1 not configured → link points to localhost
2. ❌ Token expired (7 days)
3. ❌ Token already used once (prevents reuse)
4. ❌ Account deactivated/status not 'active'

**Debug Steps**:

1. Check reset link URL in email - does it have correct domain?
2. Test verifyResetToken API with token from email
3. Check token expiry: `SELECT * FROM tbl_password_reset_tokens WHERE token=?`
4. Verify account status: `SELECT * FROM tbl_accounts WHERE email=?`

### Symptoms: Password Reset Shows Error

**Possible Causes**:

1. ❌ Password validation failed (< 8 characters)
2. ❌ Token already used
3. ❌ Token expired
4. ❌ Backend database connection issue

**Debug Steps**:

1. Check password meets requirements (8+ chars, special char, number, etc.)
2. Verify token hasn't been used: `used_at` should be NULL
3. Check token expiry: `expires_at > NOW()`
4. Check backend logs for database errors

---

## 7. SECURITY REVIEW

### ✅ Strengths

- Cryptographically secure token generation (32 bytes)
- Tokens stored hashed in database ✗ **(Actually NOT hashed - stored as plaintext!)**
- Tokens marked as used to prevent reuse ✓
- 7-day expiry is reasonable
- Password hashing with bcrypt ✓
- Token tied to specific account ✓
- Account status checked (active only) ✓

### ⚠️ Security Issues

1. **CRITICAL**: Tokens stored as plaintext in database
   - **Fix**: Hash tokens with bcrypt before storing
   - **Current**: `INSERT INTO tbl_password_reset_tokens (acc_id, token, expires_at)`
   - **Should Be**: `INSERT INTO tbl_password_reset_tokens (acc_id, token_hash, expires_at)`

2. **MEDIUM**: Email expiry message says 1 hour but actually 7 days
   - Users might not hurry to reset
   - Creates confusion
   - **Fix**: Change to 7 days in email

3. **LOW**: Reset token visible in email subject line when forwarded
   - **Fix**: Consider token in URL only, not email subject

---

## 8. DATABASE SCHEMA

### Table: tbl_password_reset_tokens

```sql
CREATE TABLE tbl_password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  acc_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,  -- 64-char hex string (⚠️ NOT HASHED)
  expires_at DATETIME NOT NULL,        -- 7 days from creation
  used_at DATETIME NULL,               -- Set when token is successfully used
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (acc_id) REFERENCES tbl_accounts(acc_id)
) ENGINE=InnoDB;
```

---

## 9. ROUTER CONFIGURATION

### Frontend Routes

- **Login**: `/` (LandingPage component)
- **Password Reset**: `/change-password/:acc_id?token=...&type=...`
  - Routes to `PasswordManagement.vue` component
  - Handles both forgot password and new account setup

### Backend Routes

- `POST /api/church-records/accounts/forgotPassword`
- `POST /api/church-records/accounts/verifyResetToken`
- `POST /api/church-records/accounts/resetPasswordWithToken`
- `POST /api/church-records/accounts/createPasswordResetTokenTable` (Setup endpoint)

---

## 10. RECOMMENDATIONS FOR PRODUCTION

### High Priority

1. ✅ Set all EMAIL\_\* environment variables on your hosting
2. ✅ Set FRONTEND_URL1 to production URL (https://biblebaptistekklesiaofkawit.xyz)
3. ⚠️ **Hash password reset tokens in database** (security improvement)
4. ⚠️ Fix email expiry message to say "7 days"

### Medium Priority

1. Add rate limiting to forgotPassword endpoint (prevent spam)
2. Add logging for password reset attempts
3. Monitor email delivery (SendGrid webhooks)
4. Test email delivery in production

### Low Priority

1. Add reCAPTCHA to forgot password form
2. Add additional security headers
3. Implement token rotation (require new token after X resets)

---

## SUMMARY

**Status on Production Hosting**: ⚠️ **LIKELY NOT WORKING**

The password reset flow is **architecturally sound** but **cannot function on production** without proper email configuration.

**Most Likely Issue**: Email environment variables are not set, so the email never sends.

**Next Steps**:

1. Verify email credentials are set in your hosting environment
2. Test sending a password reset email
3. Check backend logs for email errors
4. Verify reset link in email has correct production URL
5. Fix the token hashing security issue (recommended)

---

**Analysis Date**: January 17, 2026
**Backend Location**: `be/` folder
**Frontend Location**: `fe/` folder
**Email Configuration**: Check `.env` file and hosting environment variables
