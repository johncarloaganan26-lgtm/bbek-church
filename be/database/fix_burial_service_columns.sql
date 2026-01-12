-- Fix burial service table to use pastor_name instead of pastor_id
-- This matches the frontend and backend code expectations

-- Check if pastor_id column exists and rename it to pastor_name
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tbl_burialservice' 
    AND COLUMN_NAME = 'pastor_id'
);

SET @sql = IF(@column_exists > 0, 
  'ALTER TABLE `tbl_burialservice` CHANGE COLUMN `pastor_id` `pastor_name` VARCHAR(45) NULL;',
  'SELECT "Column pastor_id does not exist, no change needed" as message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Also ensure deceased_birthdate and date_death are properly typed
ALTER TABLE `tbl_burialservice` 
  MODIFY COLUMN `deceased_birthdate` DATE NULL,
  MODIFY COLUMN `date_death` DATETIME NULL;

-- Verify all columns
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM
  INFORMATION_SCHEMA.COLUMNS
WHERE
  TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'tbl_burialservice'
ORDER BY
  ORDINAL_POSITION;