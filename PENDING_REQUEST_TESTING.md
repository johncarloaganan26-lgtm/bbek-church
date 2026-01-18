# Pending Request Validation - Testing Guide

## Implementation Summary

Added validation to both child dedication and burial service creation endpoints to prevent members from creating new requests when they already have a pending approval.

**Files Modified:**
- `be/dbHelpers/services/childDedicationRecords.js` - Added `checkPendingChildDedicationApproval()` helper function
- `be/dbHelpers/services/burialServiceRecords.js` - Added `checkPendingBurialServiceApproval()` helper function

## How It Works

When a member tries to create a new child dedication or burial service request:

1. Backend validates required fields ✅
2. Backend checks for duplicate records ✅
3. **NEW: Backend checks for pending approval** ← This prevents duplicates
4. Backend checks for time slot conflicts ✅
5. Record is created (if all checks pass)

## Testing Instructions

### Test Case 1: Child Dedication - Prevent Duplicate Pending Requests

**Setup:**
1. Login as a member
2. Navigate to "Request Child Dedication"
3. Fill in all required fields
4. Submit the request
5. Verify request is created with status "pending"

**Test:**
1. Try to create another child dedication request for the same child
2. **Expected Result**: Error message: "You have a pending child dedication request. Please wait for approval or contact the administrator to reject it first."
3. **Expected Result**: New record is NOT created

### Test Case 2: Burial Service - Prevent Duplicate Pending Requests

**Setup:**
1. Login as a member
2. Navigate to "Request Burial Service"
3. Fill in all required fields (including deceased name and birthdate)
4. Submit the request
5. Verify request is created with status "pending"

**Test:**
1. Try to create another burial service request for the same deceased person
2. **Expected Result**: Error message: "You have a pending burial service request. Please wait for approval or contact the administrator to reject it first."
3. **Expected Result**: New record is NOT created

### Test Case 3: After Admin Rejects Approval

**Setup:**
1. Create a child dedication request (status: pending)
2. Login as admin
3. Navigate to Approvals
4. Find the pending child dedication approval
5. Reject the approval (status becomes: rejected)

**Test:**
1. Login back as the member
2. Try to create another child dedication request for the same child
3. **Expected Result**: Request succeeds (new record created)
4. New pending approval should exist

### Test Case 4: After Admin Approves Request

**Setup:**
1. Create a burial service request (status: pending)
2. Login as admin
3. Navigate to Approvals
4. Find the pending burial service approval
5. Approve the approval (status becomes: approved, service_date is set)

**Test:**
1. Login back as the member
2. Try to create another burial service request for the same deceased person
3. **Expected Result**: Request succeeds (new record created)
4. New pending approval should exist

### Test Case 5: Non-Member Burial Service Request

**Setup:**
1. As a non-member visitor, submit a burial service request with:
   - Name: John Doe
   - Email: john@example.com
   - Deceased: Jane Doe (birthdate: 1950-01-01)

**Test:**
1. Verify request is created with status "pending"
2. Try to submit another burial service request with the SAME email
3. **Expected Result**: Error message about pending approval exists
4. **Expected Result**: New record is NOT created

## Database Verification

You can verify the pending approval check is working by checking the approval table:

```sql
-- Check for pending child dedication approvals
SELECT * FROM tbl_approval 
WHERE type = 'child_dedication' 
AND status = 'pending';

-- Check for pending burial service approvals
SELECT * FROM tbl_approval 
WHERE type = 'burial_service' 
AND status = 'pending';

-- Check member's email (for matching with approval table)
SELECT member_id, email FROM tbl_members 
WHERE member_id = 'MEMBER_ID_HERE';
```

## API Response Examples

### Success Response (Request Created)
```json
{
  "success": true,
  "message": "Child dedication request created successfully",
  "child_id": "0000000045"
}
```

### Error Response (Pending Approval Exists)
```json
{
  "success": false,
  "message": "You have a pending child dedication request. Please wait for approval or contact the administrator to reject it first.",
  "error": "Pending approval exists"
}
```

## Error Message Displayed to User

Both services use user-friendly error messages:

**Child Dedication:**
> "You have a pending child dedication request. Please wait for approval or contact the administrator to reject it first."

**Burial Service:**
> "You have a pending burial service request. Please wait for approval or contact the administrator to reject it first."

## Validation Order (Important)

The checks are performed in this order for efficiency:

1. **Required fields validation** - Quick check, no database query
2. **Duplicate record check** - Quick query (checks existing records in service table)
3. **Pending approval check** - NEW validation (checks approval table)
4. **Time slot conflict check** - Complex join query

This order ensures that we reject the obvious cases (missing fields, duplicates) before checking the approval table.

## Performance Notes

- The pending approval check uses `LIMIT 1` to return as soon as it finds the first pending record
- Query includes proper indexes (type, status) in where clause
- Email lookup uses existing member index
- The check only queries when a new request is being created (not on updates/deletes)

## Troubleshooting

### Issue: Error message not appearing
- Check browser console for network errors
- Verify API response has `error` field set to 'Pending approval exists'
- Check backend logs for query execution

### Issue: User can still create duplicate requests
- Verify tbl_approval table has the pending record
- Check that the member's email in tbl_members matches the email in tbl_approval
- For non-member requests, check that requester_email matches exactly

### Issue: Permission to create after approval
- Verify the approval status changed from 'pending' to 'approved' or 'rejected'
- Query: `SELECT * FROM tbl_approval WHERE type = 'burial_service' ORDER BY created_at DESC LIMIT 5;`

## Rollback Instructions (if needed)

If this feature needs to be rolled back:

1. In `childDedicationRecords.js`, remove the pending approval check block (lines ~296-302)
2. In `burialServiceRecords.js`, remove the pending approval check block (lines ~171-183)
3. Remove the helper function exports from both files
4. Optionally remove the helper functions entirely (not required, just won't be used)
5. Restart backend server

No database changes are required - the feature only adds validation logic.
