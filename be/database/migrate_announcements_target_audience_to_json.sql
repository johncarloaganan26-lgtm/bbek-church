                                                                  -- Migration script to convert target_audience from VARCHAR to JSON array format
-- This script should be run after updating the table schema

-- First, backup the existing data (optional but recommended)
CREATE TABLE
IF
  NOT EXISTS tbl_announcements_backup AS
  SELECT
    *
  FROM
    tbl_announcements;

  -- Update existing records to convert string values to JSON arrays
  UPDATE
    tbl_announcements
  SET target_audience = CASE                   
    WHEN target_audience = 'all' THEN '["all"]'
    WHEN target_audience = 'admin' THEN '["admin"]'
    WHEN target_audience = 'pastor' THEN '["pastor"]'
    WHEN target_audience = 'member' THEN '["member"]'
    WHEN target_audience = 'non_member' THEN '["non_member"]'
    ELSE
      '["all"]' -- Default fallback for any unexpected values
  END
  WHERE
    target_audience IS NOT NULL
    AND target_audience NOT LIKE '[%' -- Only update records that aren't already JSON
    AND target_audience NOT LIKE '%]';

  -- Verify the migration
  SELECT
    announcement_id
    , title
    , target_audience
    , JSON_VALID(target_audience) as is_valid_json
  FROM
    tbl_announcements
  LIMIT
    10;

  -- Optional: Drop backup table after verification
  -- DROP TABLE IF EXISTS tbl_announcements_backup;