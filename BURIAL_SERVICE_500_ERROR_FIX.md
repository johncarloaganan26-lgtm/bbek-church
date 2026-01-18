# Burial Service 500 Error Fix Guide

## Problem
When creating a burial service request, the API returns a **500 Internal Server Error**:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
API Error: 500 Object
Error creating burial service: AxiosError
```

## Root Cause
The issue is caused by a **database foreign key constraint** on the `member_id` column in the `tbl_burialservice` table. The problem occurs when:

1. A non-member tries to create a burial service request (member_id = NULL)
2. The database has a `FOREIGN KEY` constraint on `member_id` that doesn't allow NULL values
3. The INSERT statement fails with a constraint violation error (500)

## Database Issues
The `tbl_burialservice` table has these issues:

1. **Foreign Key Constraint**: The `member_id` column has a foreign key constraint that requires a valid reference to `tbl_members.member_id`, which doesn't allow NULL values
2. **Column Name Mismatch**: The code uses `pastor_name` but the table might have `pastor_id`
3. **Non-member Support**: The backend code supports non-member requests (with `requester_name` and `requester_email`), but the database structure doesn't reflect this

## Solution

### Step 1: Run the Database Migration Script
```bash
cd be
node fix-burial-service-db.js
```

This script will:
- ✅ Drop the foreign key constraint on `member_id`
- ✅ Make `member_id` nullable
- ✅ Rename `pastor_id` to `pastor_name` (if needed)
- ✅ Verify the final table structure

### Step 2: Verify the Fix
After running the migration, try creating a burial service request again. The API should now return:
```json
{
  "success": true,
  "message": "Burial service created successfully",
  "data": { ... }
}
```

### Step 3: Manual Database Fix (Alternative)
If the script doesn't work, run these SQL commands directly in your MySQL client:

```sql
-- Drop the foreign key constraint
ALTER TABLE `tbl_burialservice` 
DROP FOREIGN KEY `fk_burial_service_member`;

-- Make member_id nullable
ALTER TABLE `tbl_burialservice` 
MODIFY COLUMN `member_id` VARCHAR(45) NULL;

-- Verify the structure
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_KEY
FROM 
  INFORMATION_SCHEMA.COLUMNS
WHERE 
  TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tbl_burialservice'
  AND COLUMN_NAME = 'member_id';
```

## Code Changes Made

### 1. Enhanced Error Handling (burialServiceRoutes.js)
- Added more detailed error messages for database constraint violations
- Returns specific error codes (e.g., ER_NO_REFERENCED_ROW_2) for easier debugging

### 2. Added Logging (burialServiceRecords.js)
- Logs the complete INSERT parameters before execution
- Helps identify which field is causing the issue

### 3. Database Migration Script (fix-burial-service-db.js)
- Automated script to fix all database issues
- Handles already-fixed columns gracefully
- Displays final table structure for verification

## Testing the Fix

### For Member Requests:
```javascript
const payload = {
  member_id: "MEM001",
  relationship: "spouse",
  location: "Church",
  status: "pending",
  deceased_name: "John Doe",
  deceased_birthdate: "1950-01-01",
  date_death: "2024-01-15"
}
```

### For Non-Member Requests:
```javascript
const payload = {
  requester_name: "Jane Smith",
  requester_email: "jane@example.com",
  relationship: "friend",
  location: "Church",
  status: "pending",
  deceased_name: "John Doe",
  deceased_birthdate: "1950-01-01",
  date_death: "2024-01-15"
}
```

Both should now work without 500 errors!

## API Response Format

### Success Response (201):
```json
{
  "success": true,
  "message": "Burial service created successfully",
  "data": {
    "burial_id": "0000000001",
    "member_id": null,
    "requester_name": "Jane Smith",
    "requester_email": "jane@example.com",
    "relationship": "friend",
    "location": "Church",
    "pastor_name": null,
    "service_date": null,
    "status": "pending",
    "date_created": "2024-01-18T10:30:00.000Z",
    "deceased_name": "John Doe",
    "deceased_birthdate": "1950-01-01",
    "date_death": "2024-01-15T00:00:00.000Z"
  }
}
```

### Error Response (400):
```json
{
  "success": false,
  "message": "You have a pending burial service request...",
  "error": "Pending approval exists"
}
```

### Server Error Response (500):
```json
{
  "success": false,
  "error": "Invalid member ID or database constraint violation...",
  "code": "ER_NO_REFERENCED_ROW_2"
}
```

## Verification Checklist

- [ ] Database migration script ran without errors
- [ ] Non-member burial service request can be created
- [ ] Member burial service request can be created
- [ ] Pending approval check works correctly
- [ ] Time slot availability check works
- [ ] Burial confirmation email is sent
- [ ] No 500 errors in API response

## Additional Notes

- The system supports both **member** and **non-member** burial service requests
- For **members**: Uses `member_id` to identify the requester
- For **non-members**: Uses `requester_name` and `requester_email`
- All requests start with `status = 'pending'` and require admin approval
- Email notifications are sent to the requester with status updates
