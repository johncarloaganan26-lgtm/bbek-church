-- Fix: Reset ALL archive records to restored = 0
-- This fixes the issue where archived records were showing as "Restored"

UPDATE tbl_archives
SET restored = 0
WHERE restored = 1 OR restored IS NULL;

-- Verify the fix
SELECT
  archive_id,
  original_table,
  original_id,
  restored,
  archived_at,
  restored_at
FROM tbl_archives
ORDER BY archive_id DESC
LIMIT 20;

-- Count by status
SELECT
  COUNT(*) as total,
  SUM(restored) as restored_count,
  SUM(CASE WHEN restored = 0 THEN 1 ELSE 0 END) as archived_count
FROM tbl_archives;
