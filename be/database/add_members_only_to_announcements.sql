-- Add members_only column to announcements table for simple visitor visibility control
ALTER TABLE tbl_announcements
ADD COLUMN members_only TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'If 1, announcement is hidden from non-logged-in visitors' AFTER is_active;

-- Update existing announcements to be visible to all (members_only = 0)
UPDATE
  tbl_announcements
SET members_only = 0
WHERE
  members_only IS NULL;