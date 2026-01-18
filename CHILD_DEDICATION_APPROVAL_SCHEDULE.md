# Child Dedication Approval - Schedule Integration

## Problem
When an admin approves a child dedication request with a scheduled date/time, that approved schedule was not being saved to the child dedication table. The member would see their requested date but not the admin-approved date.

## Solution
Updated the approval system to automatically save the admin-approved schedule (date and time) to the child dedication record when the approval is set to "approved" status.

## Changes Made

### 1. Updated Approval Route
**File:** `be/routes/church_records/approvalRoutes.js`

Modified the `updateApprovalStatus` endpoint to accept additional parameters:
```javascript
router.put('/updateApprovalStatus/:id', async (req, res) => {
  const { id } = req.params;
  const { status, schedule_date, schedule_time } = req.body;
  // Now passes schedule_date and schedule_time to the helper function
});
```

**Request Body (New):**
```json
{
  "status": "approved",
  "schedule_date": "2026-02-15",
  "schedule_time": "10:00:00"
}
```

### 2. Updated Approval Helper Function
**File:** `be/dbHelpers/church_records/approvalRecord.js`

Enhanced `updateApprovalStatus` function to handle child dedications:
```javascript
async function updateApprovalStatus(id, status, schedule_date = null, schedule_time = null) {
  // ... existing code ...
  
  // NEW: If approving a child_dedication type approval:
  if (type === 'child_dedication' && normalizedStatus === 'approved') {
    // Update preferred_dedication_date with the approved schedule_date
    // Update preferred_dedication_time with the approved schedule_time
    // Set status to 'approved' in the child dedication record
  }
}
```

## How It Works

### Admin Approves Child Dedication
1. Admin reviews pending child dedication approval
2. Admin selects the scheduled date and time
3. Admin clicks "Approve"
4. Frontend sends:
   ```json
   {
     "status": "approved",
     "schedule_date": "2026-02-15",
     "schedule_time": "10:00:00"
   }
   ```

### Backend Processing
1. System finds the approval record
2. System finds the related child dedication (using request_id = child_id)
3. System updates the child dedication record:
   - Sets `preferred_dedication_date` = approved date
   - Sets `preferred_dedication_time` = approved time
   - Sets `status` = 'approved'
4. System updates the approval record:
   - Sets `status` = 'approved'
5. Member receives notification with approved schedule

### Member Sees Updated Schedule
- Member can view their child dedication details
- They see the admin-approved schedule (not their original request)
- The child dedication table shows the scheduled date/time

## Database Updates

The child dedication record is updated with:
```sql
UPDATE tbl_childdedications 
SET 
  preferred_dedication_date = ?,      -- Admin-approved date
  preferred_dedication_time = ?,      -- Admin-approved time
  status = 'approved'
WHERE child_id = ?;
```

## Frontend Implementation

When admin approves a child dedication, the frontend should send:

```javascript
// In approval dialog/form
const approveChildDedication = async (approvalId, approvedDate, approvedTime) => {
  try {
    const response = await axios.put(
      `/api/church-records/approvals/updateApprovalStatus/${approvalId}`,
      {
        status: 'approved',
        schedule_date: approvedDate,    // Format: YYYY-MM-DD
        schedule_time: approvedTime     // Format: HH:MM:SS
      }
    );
    
    if (response.data.success) {
      ElMessage.success('Child dedication approved with scheduled date');
      // Refresh the approval list
    }
  } catch (error) {
    ElMessage.error('Failed to approve child dedication');
  }
};
```

## Database Schema

No schema changes needed - uses existing fields:
- `preferred_dedication_date` (DATE) - Updated with approved date
- `preferred_dedication_time` (TIME) - Updated with approved time
- `status` (VARCHAR) - Updated to 'approved'

## Approval Type Support

Now supports three types:
1. **event** - Adds member to event's `joined_members`
2. **ministry** - Adds member to ministry's `members`
3. **child_dedication** - Updates scheduled date/time and status (NEW)

## Testing

```bash
# Test approving a child dedication with schedule
curl -X PUT http://localhost:5000/api/church-records/approvals/updateApprovalStatus/5 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "schedule_date": "2026-02-20",
    "schedule_time": "14:00:00"
  }'
```

**Expected Result:**
- ✅ Approval record updated to "approved"
- ✅ Child dedication record updated with approved date/time
- ✅ Member notification sent
- ✅ Child dedication table shows the approved schedule

## Benefits

✅ Admin-approved schedule is now preserved in the database  
✅ Member sees the official scheduled date (not their request date)  
✅ Child dedication table shows accurate information  
✅ Consistent with event and ministry approval workflow  
✅ Automatic status update (no need for separate update call)  

## Notes

- If no schedule_date or schedule_time provided, the child dedication status is still set to 'approved'
- The function preserves backward compatibility - old calls without schedule params still work
- Schedule date/time are optional but recommended for child dedications
- Email notification includes approval status
