# Burial Service 500 Error - Manual Database Fix

## Current Status
The database server is not running or the connection is being refused. To fix the burial service 500 error, you have two options:

## Option 1: Run the Automated Script (When Database is Available)
```bash
# Start your MySQL server first, then run:
cd c:\Users\John Carlo\OneDrive\Desktop\bbek-app\be
node fix-burial-service-db.js
```

## Option 2: Manual SQL Fix (Recommended - Run Now)

Follow these steps to fix the database manually:

### Step 1: Connect to MySQL
Open your MySQL client (MySQL Workbench, DBeaver, or command line):
```bash
mysql -h localhost -u root -p
# Enter your password when prompted
```

### Step 2: Select Your Database
```sql
USE bbekdb;
-- Or whatever your database name is (check .env file for DB_NAME)
```

### Step 3: Run the SQL Migration
Copy and paste these commands one by one:

#### First, check current constraints:
```sql
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'tbl_burialservice';
```

#### Drop the foreign key constraint:
```sql
ALTER TABLE `tbl_burialservice` 
DROP FOREIGN KEY `fk_burial_service_member`;
```
*Note: If you get an error "can't drop foreign key constraint", that's OK - it means it doesn't exist*

#### Make member_id nullable:
```sql
ALTER TABLE `tbl_burialservice` 
MODIFY COLUMN `member_id` VARCHAR(45) NULL;
```

#### Check if pastor_id needs to be renamed:
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'tbl_burialservice'
  AND COLUMN_NAME IN ('pastor_id', 'pastor_name');
```

If you see `pastor_id` in the results, run:
```sql
ALTER TABLE `tbl_burialservice` 
CHANGE COLUMN `pastor_id` `pastor_name` VARCHAR(45) NULL;
```

#### Verify the fixed table structure:
```sql
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
ORDER BY ORDINAL_POSITION;
```

### Step 4: Verify the Fix
You should see a table like this:
| COLUMN_NAME | DATA_TYPE | IS_NULLABLE | COLUMN_KEY |
|---|---|---|---|
| burial_id | varchar(45) | NO | PRI |
| member_id | varchar(45) | **YES** | MUL |
| requester_name | varchar(100) | YES | |
| requester_email | varchar(100) | YES | MUL |
| relationship | varchar(45) | NO | |
| location | varchar(100) | YES | |
| pastor_name | varchar(45) | YES | |
| service_date | datetime | YES | |
| status | varchar(45) | NO | |
| date_created | datetime | NO | |
| deceased_name | varchar(100) | YES | |
| deceased_birthdate | date | YES | |
| date_death | date | YES | |

**Key things to check:**
- ✅ `member_id` IS_NULLABLE should be **YES**
- ✅ `pastor_name` should exist (not `pastor_id`)
- ✅ `requester_name` and `requester_email` should exist

## Option 3: Start Backend Server (Test if Database Auto-Connects)
```bash
cd c:\Users\John Carlo\OneDrive\Desktop\bbek-app\be
npm start
# or
node index.js
```

If the server starts successfully and stays running, the database connection might work. Then try:
```bash
node fix-burial-service-db.js
```

## Troubleshooting

### "Can't drop foreign key constraint"
- **Cause**: The constraint doesn't exist (probably already dropped)
- **Solution**: Continue with the next steps, this is normal

### "Column 'member_id' not found"
- **Cause**: The table structure is different than expected
- **Solution**: Run the verification query to see current columns:
```sql
DESCRIBE tbl_burialservice;
```

### "Database does not exist"
- **Cause**: Wrong database selected or database not created
- **Solution**: Check your `.env` file for `DB_NAME`:
```bash
# From be directory
type .env | find "DB_NAME"
```

### "ECONNREFUSED"
- **Cause**: MySQL server is not running
- **Solution**: 
  - Windows: Start MySQL from Services or start the MySQL service
  - MySQL command: `mysqld` or use MySQL Workbench
  - Check connection details in `.env` file

## After Applying the Fix

1. **Restart the Backend Server**:
```bash
cd c:\Users\John Carlo\OneDrive\Desktop\bbek-app\be
npm start
```

2. **Test Burial Service Creation**:
   - Navigate to the burial service form in your app
   - Test creating a burial service request for a non-member
   - The request should complete without a 500 error

3. **Verify the Response**:
   - You should see a success message
   - The burial service should be created with `status: 'pending'`
   - An email should be sent (if configured)

## SQL File Locations

If you want to run the SQL from a file instead of copying commands:

1. **Simple Fix** (recommended for manual execution):
```bash
# Use the file from MySQL Workbench or command line:
mysql -h localhost -u root -p bbekdb < be/database/fix_burial_service_member_id_fk.sql
```

2. **Complete Fix** (includes all checks):
```bash
mysql -h localhost -u root -p bbekdb < be/database/fix_burial_service_columns.sql
```

## Expected Results After Fix

### For Non-Member Requests:
```javascript
// Frontend sends:
{
  requester_name: "Jane Smith",
  requester_email: "jane@example.com",
  relationship: "friend",
  location: "Church",
  deceased_name: "John Doe",
  deceased_birthdate: "1950-01-01",
  date_death: "2024-01-15"
}

// Backend returns:
{
  "success": true,
  "message": "Burial service created successfully",
  "data": {
    "burial_id": "0000000001",
    "member_id": null,  // ← This will be null
    "requester_name": "Jane Smith",
    "requester_email": "jane@example.com",
    // ... other fields
  }
}
```

### For Member Requests:
```javascript
// Frontend sends:
{
  member_id: "MEM001",
  relationship: "spouse",
  location: "Church",
  deceased_name: "John Doe",
  deceased_birthdate: "1950-01-01",
  date_death: "2024-01-15"
}

// Backend returns successfully
```

## Need More Help?

Check these files:
- Backend route: [be/routes/services/burialServiceRoutes.js](../be/routes/services/burialServiceRoutes.js)
- Service logic: [be/dbHelpers/services/burialServiceRecords.js](../be/dbHelpers/services/burialServiceRecords.js)
- Error details: Check server logs in terminal
