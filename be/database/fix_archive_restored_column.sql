-- Fix: Ensure tbl_archives.restored column has proper default value
-- This fixes the issue where archived records were showing as "Restored" (restored = 1)
-- instead of "Archived" (restored = 0)

-- Step 1: Reset all archive records to restored = 0
UPDATE
  tbl_archives
SET restored = 0
WHERE
  restored = 1
  OR restored IS NULL;

-- Step 2: Ensure the column exists with proper definition
-- If the column doesn't exist, create it
-- (Adjust table schema if needed for your MySQL version)

-- Step 3: Verify the fix
SELECT
  archive_id
  , original_table
  , original_id
  , restored
  , archived_at
  , restored_at
FROM
  tbl_archives
ORDER BY
  archive_id DESC
LIMIT
  20;

-- Step 4: Count by status to verify
SELECT
  COUNT(*) as total
  , SUM(restored) as restored_count
  , SUM(
    CASE
      WHEN restored = 0 THEN 1
      ELSE 0
    END
  ) as archived_count
FROM
  tbl_archives;