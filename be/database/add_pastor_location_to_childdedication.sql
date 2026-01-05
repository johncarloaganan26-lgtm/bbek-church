-- ============================================
-- Add Pastor and Location Fields to Child Dedication Table
-- ============================================
-- This script adds pastor and location fields to the tbl_childdedications table
--
-- These fields will be used to store:
-- - pastor: The name of the pastor conducting the dedication
-- - location: The location where the dedication will take place
--
-- These fields will be nullable as they may not be known at the time of request
-- ============================================

-- Add pastor and location columns to the table
ALTER TABLE tbl_childdedications
ADD COLUMN pastor VARCHAR(255) NULL COMMENT 'Name of the pastor conducting the dedication'
, ADD COLUMN location VARCHAR(255) NULL COMMENT 'Location where the dedication will take place';

-- ============================================
-- Notes:
-- - pastor field stores the pastor's name (VARCHAR 255 for flexibility)
-- - location field stores the dedication location (VARCHAR 255)
-- - Both fields are nullable as they may be determined later by admin/staff
-- - Fields are added at the end of the table structure
-- ============================================

-- Optional: Add indexes if needed for performance
-- CREATE INDEX idx_pastor ON tbl_childdedications(pastor);
-- CREATE INDEX idx_location ON tbl_childdedications(location);