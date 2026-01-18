# Unknown Column 'id' Error - Fixed

## Problem
When creating a burial service or child dedication request, the API returns:
```
Unknown column 'id' in 'field list'
```

This error occurred in both:
- Burial service creation (from landing page or member login)
- Child dedication creation (from member login)

## Root Cause
The pending approval check functions were querying non-existent columns from the `tbl_approval` table:
- Used `id` instead of `approval_id` (primary key)
- Used `created_at` instead of `date_created` (timestamp column)

The actual `tbl_approval` table structure has:
- `approval_id` (INT, Primary Key, Auto-increment)
- `type` (VARCHAR)
- `email` (VARCHAR)
- `status` (VARCHAR)
- `date_created` (DATETIME) ← Not `created_at`
- `request_id` (INT)

## Files Fixed

### 1. [burialServiceRecords.js](be/dbHelpers/services/burialServiceRecords.js#L91-L96)
**Function**: `checkPendingBurialServiceApproval()`

**Before:**
```javascript
let sql = `SELECT id, type, status, created_at 
             FROM tbl_approval 
             WHERE type = 'burial_service' 
             AND status = 'pending'
             AND (`;
```

**After:**
```javascript
let sql = `SELECT approval_id, type, status, date_created 
             FROM tbl_approval 
             WHERE type = 'burial_service' 
             AND status = 'pending'
             AND (`;
```

### 2. [childDedicationRecords.js](be/dbHelpers/services/childDedicationRecords.js#L130-L137)
**Function**: `checkPendingChildDedicationApproval()`

**Before:**
```javascript
const sql = `SELECT id, type, status, created_at 
             FROM tbl_approval 
             WHERE type = 'child_dedication' 
             AND email IN (
               SELECT email FROM tbl_members WHERE member_id = ?
             )
             AND status = 'pending'
             LIMIT 1`;
```

**After:**
```javascript
const sql = `SELECT approval_id, type, status, date_created 
             FROM tbl_approval 
             WHERE type = 'child_dedication' 
             AND email IN (
               SELECT email FROM tbl_members WHERE member_id = ?
             )
             AND status = 'pending'
             LIMIT 1`;
```

## Changes Summary
| Item | Before | After |
|---|---|---|
| Column name | `id` | `approval_id` |
| Timestamp column | `created_at` | `date_created` |
| Files affected | 2 | 2 |
| Functions fixed | 2 | 2 |

## Testing the Fix

### 1. Clear Browser Cache
```
Ctrl + Shift + Delete (or Cmd + Shift + Delete on Mac)
```

### 2. Test Burial Service Creation
- Navigate to the landing page burial service form
- Fill in all required fields
- Submit the form
- **Expected**: Success message (no "Unknown column 'id'" error)

### 3. Test Member Burial Service Creation
- Login as a member
- Navigate to burial service request form
- Fill in all required fields
- Submit the form
- **Expected**: Success message

### 4. Test Child Dedication Creation
- Login as a member
- Navigate to child dedication request form
- Fill in all required fields
- Submit the form
- **Expected**: Success message

### 5. Verify Approval Record Created
- Login as admin
- Navigate to Approvals section
- Check that new approval records appear with:
  - `type`: "burial_service" or "child_dedication"
  - `status`: "pending"
  - `date_created`: Current timestamp

## What This Fix Does

The pending approval check now correctly:
1. ✅ Queries the correct column names from `tbl_approval`
2. ✅ Retrieves the approval ID for tracking
3. ✅ Checks if a user has any pending requests (blocks duplicate submissions)
4. ✅ Works for both member and non-member requests

## API Response After Fix

### Success (No pending approval):
```json
{
  "success": true,
  "message": "Burial service created successfully",
  "data": {
    "burial_id": "0000000001",
    "member_id": "MEM001",
    "requester_name": "John Smith",
    "status": "pending"
  }
}
```

### Error (Already has pending):
```json
{
  "success": false,
  "message": "You have a pending burial service request. Please wait for approval...",
  "error": "Pending approval exists"
}
```

## Additional Notes
- The fix applies to the query structure, not the logic
- Pending approval validation still works correctly
- Both member and non-member requests are supported
- The fix is backward compatible with existing data
