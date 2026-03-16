-- Migration to add 'Promoted' status to Bible Study requests
ALTER TABLE tbl_biblestudy_requests 
MODIFY COLUMN status ENUM('Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected', 'Promoted') DEFAULT 'Pending';
