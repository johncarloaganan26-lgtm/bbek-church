# Pending Request Validation Implementation

## Overview
Added validation to prevent members from creating new burial service and child dedication requests when they already have a pending approval in the system.

## Changes Made

### 1. Child Dedication Records (`be/dbHelpers/services/childDedicationRecords.js`)

#### New Helper Function: `checkPendingChildDedicationApproval(memberId)`
- **Purpose**: Check if a member has any pending child dedication approval
- **Location**: Lines 84-101
- **Logic**:
  - Queries `tbl_approval` table for records with:
    - `type = 'child_dedication'`
    - `status = 'pending'`
    - `email` matching the member's email from `tbl_members`
  - Returns object with `hasPendingApproval` flag and approval details
  - Uses LIMIT 1 for efficiency (only need to know if one exists)

#### Updated: `createChildDedication()` Function
- **Location**: Added validation at line ~278 (after duplicate check)
- **Logic**:
  ```javascript
  // Check if member has a pending child dedication approval
  const pendingApprovalCheck = await checkPendingChildDedicationApproval(requested_by.trim());
  if (pendingApprovalCheck.hasPendingApproval) {
    return {
      success: false,
      message: 'You have a pending child dedication request. Please wait for approval or contact the administrator to reject it first.',
      error: 'Pending approval exists'
    };
  }
  ```
- **Error Message**: User-friendly message explaining they need to wait for approval or contact admin
- **HTTP Response**: Returns error object preventing record creation

#### Updated Exports
- Added `checkPendingChildDedicationApproval` to module.exports

### 2. Burial Service Records (`be/dbHelpers/services/burialServiceRecords.js`)

#### New Helper Function: `checkPendingBurialServiceApproval(memberId, requesterEmail)`
- **Purpose**: Check if a member/requester has any pending burial service approval
- **Location**: Lines 75-110
- **Logic**:
  - Queries `tbl_approval` table for records with:
    - `type = 'burial_service'`
    - `status = 'pending'`
    - `email` matching either:
      - Member's email from `tbl_members` (if memberId provided)
      - Direct requester_email (for non-member requests)
  - Uses OR logic to support both member and non-member requests
  - Returns object with `hasPendingApproval` flag and approval details

#### Updated: `createBurialService()` Function
- **Location**: Added validation after duplicate check (around line 175)
- **Logic**:
  ```javascript
  // Check if member has a pending burial service approval
  const pendingApprovalCheck = await checkPendingBurialServiceApproval(
    member_id ? String(member_id).trim() : null,
    requester_email ? String(requester_email).trim() : null
  );
  if (pendingApprovalCheck.hasPendingApproval) {
    return {
      success: false,
      message: 'You have a pending burial service request. Please wait for approval or contact the administrator to reject it first.',
      error: 'Pending approval exists'
    };
  }
  ```
- **Supports**: Both member and non-member requests
- **HTTP Response**: Returns error object preventing record creation

#### Updated Exports
- Added `checkPendingBurialServiceApproval` to module.exports

## Database Queries

### Child Dedication Check
```sql
SELECT id, type, status, created_at 
FROM tbl_approval 
WHERE type = 'child_dedication' 
AND email IN (
  SELECT email FROM tbl_members WHERE member_id = ?
)
AND status = 'pending'
LIMIT 1
```

### Burial Service Check
```sql
SELECT id, type, status, created_at 
FROM tbl_approval 
WHERE type = 'burial_service' 
AND status = 'pending'
AND (
  email IN (SELECT email FROM tbl_members WHERE member_id = ?) 
  OR email = ?
)
LIMIT 1
```

## Validation Flow

### Child Dedication Request
1. ✅ Validate required fields
2. ✅ Check for duplicate child dedication (same child name, birthdate)
3. **🆕 Check for pending approval** ← NEW
4. ✅ Check for time slot conflicts
5. ✅ Insert record and notify member

### Burial Service Request
1. ✅ Validate required fields
2. ✅ Check for duplicate deceased (same name, birthdate)
3. **🆕 Check for pending approval** ← NEW
4. ✅ Check for time slot conflicts
5. ✅ Insert record and notify member

## Error Response Format

When a pending approval is detected, both services return:
```javascript
{
  success: false,
  message: 'You have a pending [child dedication|burial service] request. Please wait for approval or contact the administrator to reject it first.',
  error: 'Pending approval exists'
}
```

## Frontend Impact

The frontend API call handlers will receive a 400 Bad Request with the error object. Existing error handling in Vue components should catch this and display the user-friendly message to the member.

## Testing Scenarios

### Test Case 1: Child Dedication with Pending Approval
1. Create a child dedication request → Status: pending
2. Attempt to create another child dedication request
3. Expected: Error message "You have a pending child dedication request..."
4. Expected: New record NOT created

### Test Case 2: Burial Service with Pending Approval
1. Create a burial service request → Status: pending
2. Attempt to create another burial service request
3. Expected: Error message "You have a pending burial service request..."
4. Expected: New record NOT created

### Test Case 3: After Approval Rejection
1. Create a child/burial service request → Status: pending
2. Admin rejects the approval → Status: rejected
3. Attempt to create another child/burial service request
4. Expected: Request succeeds (no pending approval)
5. Expected: New record created

### Test Case 4: After Approval Acceptance
1. Create a child/burial service request → Status: pending
2. Admin approves the request → Status: approved
3. Attempt to create another child/burial service request
4. Expected: Request succeeds (no pending approval)
5. Expected: New record created

## Benefits

✅ **Prevents Duplicate Requests**: Members can't spam multiple requests for the same service  
✅ **Improves Admin Workflow**: Admins only see one pending approval per member per service  
✅ **Clear User Feedback**: Members understand why their request was rejected  
✅ **Supports Both Members & Non-Members**: Burial service logic handles both cases  
✅ **Minimal Performance Impact**: LIMIT 1 query optimization, runs before time-consuming operations  

## Code Quality

- ✅ No syntax errors
- ✅ Consistent with existing code patterns
- ✅ Proper error handling
- ✅ Helper functions exported properly
- ✅ Comprehensive logging for debugging
