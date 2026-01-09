-- Department Officer CMS Table
-- Run this SQL to add the departmentofficer CMS table for the Department Officers page

-- Create the tbl_cms_departmentofficer table if it doesn't exist
CREATE TABLE IF NOT EXISTS tbl_cms_departmentofficer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_name VARCHAR(50) DEFAULT 'departmentofficer' UNIQUE,
  content_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default row for departmentofficer page (if not exists)
INSERT IGNORE INTO tbl_cms_departmentofficer (page_name, content_json) VALUES (
  'departmentofficer',
  '{"heroTitle":"Department Officers","heroSubtitle":"Dedicated leaders serving and growing together in Christ.","backgroundColor":"#ffffff","backButtonText":"Back to About","backButtonColor":"#14b8a6","departments":[{"name":"Adult Ladies Department","officers":[{"name":"Sis. Danica Aldousari","role":"President/Coordinator","image":""},{"name":"Sis. Melody Bilog","role":"Vice President","image":""},{"name":"Sis. Espie Apelado","role":"Secretary","image":""},{"name":"Sis. Nancy Belleza","role":"Treasurer","image":""},{"name":"Ma''am Gina Sulapas","role":"Auditor","image":""}]},{"name":"Adult Men Department","officers":[{"name":"Bro. Danny Delos santos","role":"President","image":""},{"name":"Bro. Roland Santos","role":"Vice President","image":""},{"name":"Bro. Robert Apelado","role":"Secretary","image":""},{"name":"Bro. Rowel Bucayan","role":"Treasurer","image":""}]},{"name":"Young People Department","officers":[{"name":"Sis. Jessica Las","role":"President","image":""},{"name":"Bro. Jessie Timuat","role":"Vice President","image":""},{"name":"Sis. Erica Villegas","role":"Secretary","image":""},{"name":"Sis. Selah Acojedo","role":"Assistant Secretary","image":""},{"name":"Sis. Frena May Sulapas","role":"Treasurer","image":""},{"name":"Sis. Camille Bucayan","role":"PIO","image":""},{"name":"Sis. Donita Sibugan","role":"Social Media Coordinator","image":""}]}]}'
);
