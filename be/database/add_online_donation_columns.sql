-- Database Migration: Add Online Donation Support Columns to tbl_tithes
-- Date: February 11, 2026
-- Purpose: Enable online donation proof submission from the Give page

-- Step 1: Add 'source' column to distinguish online vs in-person donations
ALTER TABLE tbl_tithes
ADD COLUMN source VARCHAR(20) DEFAULT 'in-person' AFTER donation_date;

-- Step 2: Add 'proof_image' column to store receipt screenshots (LONGBLOB)
ALTER TABLE tbl_tithes
ADD COLUMN proof_image LONGBLOB NULL AFTER source;

-- Step 3: Add 'proof_image_type' column to store MIME type of the proof image
ALTER TABLE tbl_tithes
ADD COLUMN proof_image_type VARCHAR(50) NULL AFTER proof_image;

-- Step 4: Add 'donor_name_online' for non-member online donors (separate from member_name)
-- Note: We'll reuse member_name for online donors as well, no extra column needed

-- Step 5: Add 'donation_method' column for online payment method (gcash, maya, others)
ALTER TABLE tbl_tithes
ADD COLUMN donation_method VARCHAR(50) NULL AFTER proof_image_type;

-- Step 6: Add 'donation_method_other' for when method is 'others'
ALTER TABLE tbl_tithes
ADD COLUMN donation_method_other VARCHAR(100) NULL AFTER donation_method;

-- Step 7: Add 'verified_by' column - admin who confirmed/rejected the donation
ALTER TABLE tbl_tithes
ADD COLUMN verified_by INT NULL AFTER donation_method_other;

-- Step 8: Add 'verified_date' column - when the donation was verified
ALTER TABLE tbl_tithes
ADD COLUMN verified_date DATETIME NULL AFTER verified_by;

-- Step 9: Add 'rejection_reason' column - reason if donation is rejected
ALTER TABLE tbl_tithes
ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER verified_date;

-- Step 10: Add 'donor_email' for notifications
ALTER TABLE tbl_tithes
ADD COLUMN donor_email VARCHAR(255) NULL AFTER member_name;

-- Step 11: Add 'admin_proof_image' for admin to upload bank receipt/proof of verification
ALTER TABLE tbl_tithes
ADD COLUMN admin_proof_image LONGBLOB NULL AFTER rejection_reason;

-- Step 12: Add 'admin_proof_image_type'
ALTER TABLE tbl_tithes
ADD COLUMN admin_proof_image_type VARCHAR(50) NULL AFTER admin_proof_image;

-- Step 10: Update existing records to have source = 'in-person' and status = 'confirmed'
UPDATE tbl_tithes
SET source = 'in-person'
WHERE source IS NULL;

-- Note: Existing records already have status = 'pending', 
-- we should update in-person records to 'confirmed' since they were entered by admin
UPDATE tbl_tithes
SET status = 'confirmed'
WHERE source = 'in-person' AND (status = 'pending' OR status IS NULL);

-- Step 11: Create indexes for better query performance
CREATE INDEX idx_tithes_source ON tbl_tithes(source);
CREATE INDEX idx_tithes_status ON tbl_tithes(status);
CREATE INDEX idx_tithes_donation_method ON tbl_tithes(donation_method);
CREATE INDEX idx_tithes_verified_by ON tbl_tithes(verified_by);
