-- Add donor_email for notifications (after member_name)
-- ALREADY EXISTS: ALTER TABLE tbl_tithes ADD COLUMN donor_email VARCHAR(255) NULL AFTER member_name;

-- Add admin_proof_image for admin verification proof (after rejection_reason)
ALTER TABLE tbl_tithes
ADD COLUMN admin_proof_image LONGBLOB NULL AFTER rejection_reason;

-- Add admin_proof_image_type for the proof image mapping
ALTER TABLE tbl_tithes
ADD COLUMN admin_proof_image_type VARCHAR(50) NULL AFTER admin_proof_image;
