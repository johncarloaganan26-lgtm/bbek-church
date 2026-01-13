-- Alter date_created column from VARCHAR to DATETIME
-- This fixes issues with date queries in audit trail

-- First, add a temporary column to store converted dates
ALTER TABLE `tbl_audit_trail`
ADD COLUMN `date_created_temp` DATETIME;

-- Convert existing VARCHAR dates to DATETIME
UPDATE
  `tbl_audit_trail`
SET `date_created_temp` = CASE
  WHEN
    `date_created` REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]+Z$'
  THEN
    STR_TO_DATE(LEFT(`date_created`, 19), '%Y-%m-%dT%H:%i:%s')
  WHEN
    `date_created` REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'
  THEN
    STR_TO_DATE(LEFT(`date_created`, 19), '%Y-%m-%dT%H:%i:%s')
  ELSE NOW()
END
WHERE
  `date_created` IS NOT NULL
  AND `date_created` != '';

-- Drop old column and rename new one
ALTER TABLE `tbl_audit_trail`
DROP COLUMN `date_created`;
ALTER TABLE `tbl_audit_trail` CHANGE COLUMN `date_created_temp` `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the action occurred';