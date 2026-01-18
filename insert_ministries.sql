-- Insert Ministry Data
-- These ministries will be visible to everyone (public viewing)

INSERT INTO tbl_ministry (ministry_name, schedule, leader_id, department_id, members, status, date_created, description)
VALUES 
('Street Preaching', '2026-02-01 09:00:00', 1, 1, '[]', 'active', NOW(), 'A ministry dedicated to sharing the Gospel on the streets and in public spaces.'),
('Soulwinning/Evangelism', '2026-02-02 14:00:00', 2, 1, '[]', 'active', NOW(), 'We are committed to winning souls for Christ through personal evangelism and outreach.'),
('Lord Supper', '2026-02-03 18:00:00', 3, 1, '[]', 'active', NOW(), 'Celebrating the communion and remembering the sacrifice of Jesus Christ.'),
('Daily Vacation Bible School', '2026-07-01 08:00:00', 4, 3, '[]', 'active', NOW(), 'Summer Bible school program for children to learn about God''s Word in a fun environment.'),
('Feeding Program', '2026-02-04 12:00:00', 5, 1, '[]', 'active', NOW(), 'Serving the community by providing meals and basic necessities to those in need.'),
('Outreach Program', '2026-02-05 10:00:00', 6, 1, '[]', 'active', NOW(), 'Community outreach initiatives to help those in need and spread God''s love.'),
('Building Strong Family in Christ (BASFIC)', '2026-02-06 19:00:00', 7, 1, '[]', 'active', NOW(), 'Strengthening families through Biblical teachings and Christian values.'),
('Bible Studies', '2026-02-07 15:00:00', 8, 1, '[]', 'active', NOW(), 'Regular Bible study sessions for deeper understanding of God''s Word.'),
('Prayer and Fasting', '2026-02-08 06:00:00', 9, 1, '[]', 'active', NOW(), 'A ministry dedicated to intercessory prayer and spiritual fasting.');

-- Verify the data was inserted
SELECT 
  ministry_id,
  ministry_name,
  status,
  department_id,
  schedule,
  date_created
FROM tbl_ministry
WHERE ministry_name IN (
  'Street Preaching',
  'Soulwinning/Evangelism',
  'Lord Supper',
  'Daily Vacation Bible School',
  'Feeding Program',
  'Outreach Program',
  'Building Strong Family in Christ (BASFIC)',
  'Bible Studies',
  'Prayer and Fasting'
)
ORDER BY ministry_id DESC;

-- Summary count
SELECT 
  COUNT(*) as total_ministries,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_ministries
FROM tbl_ministry;
