-- Add live service link and tags columns to tbl_ministry
-- This enables ministries to have live streaming URLs like events

ALTER TABLE tbl_ministry ADD COLUMN link VARCHAR(500) NULL COMMENT 'Live streaming URL (YouTube Live, Facebook Live, etc.)';

ALTER TABLE tbl_ministry ADD COLUMN tags VARCHAR(500) NULL COMMENT 'Tags for filtering (e.g., "Ministry", "Worship", "Teaching")';

-- Optional: Add indexes for better query performance
-- ALTER TABLE tbl_ministry ADD INDEX idx_link (link);
-- ALTER TABLE tbl_ministry ADD INDEX idx_tags (tags);
