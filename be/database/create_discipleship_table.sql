-- Create Discipleship Requests table for Phase 1 (Salvation/Bible Study)
CREATE TABLE IF NOT EXISTS tbl_discipleship_requests (
  request_id VARCHAR(50) PRIMARY KEY,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  email VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  birthdate DATE NULL,
  age INT NULL,
  gender VARCHAR(10) NULL,
  address TEXT NULL,
  civil_status VARCHAR(20) NULL,
  profession VARCHAR(100) NULL,
  spouse_name VARCHAR(100) NULL,
  marriage_date DATE NULL,
  children TEXT NULL, -- JSON string for children data
  request_type ENUM('Salvation', 'Bible Study', 'Both') DEFAULT 'Salvation',
  status ENUM('Pending', 'Scheduled', 'Completed', 'Cancelled', 'Promoted') DEFAULT 'Pending',
  scheduled_date DATETIME NULL,
  scheduled_time TIME NULL,
  notes TEXT NULL,
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add index for faster searching
CREATE INDEX idx_discipleship_email ON tbl_discipleship_requests(email);
CREATE INDEX idx_discipleship_status ON tbl_discipleship_requests(status);
