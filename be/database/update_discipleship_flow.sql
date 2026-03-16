-- Update status enum to include 'Rejected'
ALTER TABLE tbl_discipleship_requests 
MODIFY COLUMN status ENUM('Pending', 'Scheduled', 'Completed', 'Cancelled', 'Promoted', 'Rejected') DEFAULT 'Pending';

-- Create Bible Study Requests table
CREATE TABLE IF NOT EXISTS tbl_biblestudy_requests (
  request_id VARCHAR(50) PRIMARY KEY,
  salvation_id VARCHAR(50) NULL, -- Reference to the original salvation request if any
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  address TEXT NULL,
  status ENUM('Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected', 'Promoted') DEFAULT 'Pending',
  scheduled_date DATETIME NULL,
  pastor_id VARCHAR(50) NULL,
  location VARCHAR(255) NULL,
  notes TEXT NULL,
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (salvation_id) REFERENCES tbl_discipleship_requests(request_id) ON DELETE SET NULL
);

-- Create Salvation Availability table
CREATE TABLE IF NOT EXISTS tbl_salvation_availability (
  availability_id INT AUTO_INCREMENT PRIMARY KEY,
  available_date DATE NOT NULL,
  available_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by_id VARCHAR(50) NULL, -- request_id from tbl_discipleship_requests
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Promotion Visits table
CREATE TABLE IF NOT EXISTS tbl_promotion_visits (
  visit_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL, -- Reference to tbl_discipleship_requests
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Visited', 'Cancelled') DEFAULT 'Pending',
  date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES tbl_discipleship_requests(request_id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX idx_biblestudy_email ON tbl_biblestudy_requests(email);
CREATE INDEX idx_biblestudy_status ON tbl_biblestudy_requests(status);
CREATE INDEX idx_salvation_availability_date ON tbl_salvation_availability(available_date);
CREATE INDEX idx_promotion_visit_request ON tbl_promotion_visits(request_id);
