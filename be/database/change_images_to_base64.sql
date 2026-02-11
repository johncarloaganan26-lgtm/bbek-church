-- Migration: Change image columns from BLOB to LONGTEXT for base64 storage
-- This resolves BLOB corruption issues with typeCast

-- Check current column type first
-- ALTER TABLE tbl_events MODIFY COLUMN image LONGTEXT;

-- 1. Change tbl_events.image from BLOB to LONGTEXT
ALTER TABLE tbl_events MODIFY COLUMN image LONGTEXT;

-- 2. Change tbl_waterbaptism.image from BLOB to LONGTEXT (if exists)
-- First check if column exists
SELECT
  COLUMN_NAME
FROM
  INFORMATION_SCHEMA.COLUMNS
WHERE
  TABLE_NAME = 'tbl_waterbaptism'
  AND COLUMN_NAME = 'image';

-- If exists, change it
ALTER TABLE tbl_waterbaptism MODIFY COLUMN image LONGTEXT;

-- 3. Change tbl_cms_images.image_blob from LONGBLOB to LONGTEXT
ALTER TABLE tbl_cms_images MODIFY COLUMN image_blob LONGTEXT;

-- Note: After running this migration, restart the backend server
-- The typeCast function in db.js now properly handles LONGTEXT as strings
-- and images will be stored and retrieved as base64 strings