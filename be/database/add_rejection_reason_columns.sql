-- ============================================
-- Add Rejection Reason Columns to Service Tables
-- ============================================
-- This script adds columns to track rejection/cancellation reasons
-- for better audit trail and communication with requesters
-- ============================================

-- Add columns to tbl_childdedications
ALTER TABLE tbl_childdedications
ADD COLUMN rejection_reason VARCHAR(1000) NULL COMMENT 'Reason for rejection or cancellation'
, ADD COLUMN rejected_by VARCHAR(45) NULL COMMENT 'Member ID of admin who rejected'
, ADD COLUMN rejected_at DATETIME NULL COMMENT 'Timestamp when rejection occurred';

-- Add columns to tbl_burialservice
ALTER TABLE tbl_burialservice
ADD COLUMN rejection_reason VARCHAR(1000) NULL COMMENT 'Reason for rejection or cancellation'
, ADD COLUMN rejected_by VARCHAR(45) NULL COMMENT 'Member ID of admin who rejected'
, ADD COLUMN rejected_at DATETIME NULL COMMENT 'Timestamp when rejection occurred';

-- Add columns to tbl_waterbaptism
ALTER TABLE tbl_waterbaptism
ADD COLUMN rejection_reason VARCHAR(1000) NULL COMMENT 'Reason for rejection or cancellation'
, ADD COLUMN rejected_by VARCHAR(45) NULL COMMENT 'Member ID of admin who rejected'
, ADD COLUMN rejected_at DATETIME NULL COMMENT 'Timestamp when rejection occurred';

-- Add indexes for faster queries
CREATE INDEX idx_childdedications_rejected_at
ON tbl_childdedications(rejected_at);
CREATE INDEX idx_burialservice_rejected_at
ON tbl_burialservice(rejected_at);
CREATE INDEX idx_waterbaptism_rejected_at
ON tbl_waterbaptism(rejected_at);

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify columns were added:
-- SHOW COLUMNS FROM tbl_childdedications LIKE 'rejection%';
-- SHOW COLUMNS FROM tbl_burialservice LIKE 'rejection%';
-- SHOW COLUMNS FROM tbl_waterbaptism LIKE 'rejection%';
-- ============================================