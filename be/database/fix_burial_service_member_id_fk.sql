-- Fix burial service table to allow NULL member_id for non-member requests
-- This removes the foreign key constraint that prevents NULL values

-- Step 1: Check if the foreign key constraint exists and drop it if present
SET @constraint_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_burial_service_member'
);

SET @drop_fk = IF(@constraint_exists > 0, 
  'ALTER TABLE `tbl_burialservice` DROP FOREIGN KEY `fk_burial_service_member`;',
  'SELECT "Foreign key does not exist, skipping drop" as info;'
);

PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Make member_id nullable
ALTER TABLE `tbl_burialservice` 
MODIFY COLUMN `member_id` VARCHAR(45) NULL;

-- Step 3: Verify the column structure
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
