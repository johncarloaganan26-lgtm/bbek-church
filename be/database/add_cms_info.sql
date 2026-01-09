-- Info CMS Table
-- Run this SQL to add the info CMS table for the homepage info section

-- Create the tbl_cms_info table if it doesn't exist
CREATE TABLE
IF
  NOT EXISTS tbl_cms_info (
    id INT AUTO_INCREMENT PRIMARY KEY
    , page_name VARCHAR(50) DEFAULT 'info' UNIQUE
    , content_json JSON
    , created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    , updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON
    UPDATE
      CURRENT_TIMESTAMP
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

  -- Insert default row for info page (if not exists)
  INSERT IGNORE
  INTO
    tbl_cms_info (page_name, content_json)
  VALUES
    (
      'info'
      , '{"backgroundImage":"/img/abt.jpg","column1Icon":"mdi-clock-outline","column1Title":"SUNDAY SERVICE","column1Text":"Bible Baptist Ekklesia of Kawit<br>Time: 10:00am<br>Location: 485 Acacia St., Villa Ramirez, Tabon 1, Kawit, Cavite","column2Icon":"mdi-laptop","column2Title":"WATCH ONLINE","column2Text":"Sunday: 10:00am<br>Wednesday: 7:00pm","watchLiveButtonText":"WATCH LIVE","watchLiveLink":"/live","column3Icon":"mdi-cash","column3Title":"GIVE","column3Text":"Support the ministry and missions of our church.<br>Be a part of what God is doing.","giveButtonText":"GIVE","giveLink":"/give","buttonColor":"#008080"}'
    );