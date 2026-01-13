-- Insert sample system logs data
INSERT INTO
  system_logs (
    user_id
    , user_name
    , role
    , action
    , page
    , description
    , ip_address
    , device_info
  )
VALUES
  (
    1
    , 'Admin John'
    , 'Admin'
    , 'Login'
    , 'Login Page'
    , 'Admin John logged in successfully'
    , '192.168.1.1'
    , 'Chrome'
  )
  , (
    2
    , 'Felix Manjares'
    , 'Staff'
    , 'Create'
    , 'Marriage Page'
    , 'Staff added new marriage record for Jane and Paul'
    , '192.168.1.2'
    , 'Firefox'
  )
  , (
    2
    , 'Felix Manjares'
    , 'Staff'
    , 'Update'
    , 'Event Page'
    , 'Staff updated event details for Youth Fellowship'
    , '192.168.1.2'
    , 'Firefox'
  )
  , (
    1
    , 'Admin John'
    , 'Admin'
    , 'Export'
    , 'Tithes & Offering'
    , 'Admin exported tithes record to CSV'
    , '192.168.1.1'
    , 'Chrome'
  )
  , (
    1
    , 'Admin John'
    , 'Admin'
    , 'Print'
    , 'Marriage Page'
    , 'Admin printed marriage certificate of Juan Dela Cruz'
    , '192.168.1.1'
    , 'Chrome'
  )
  , (
    2
    , 'Felix Manjares'
    , 'Staff'
    , 'Logout'
    , 'Dashboard'
    , 'Staff logged out from the system'
    , '192.168.1.2'
    , 'Firefox'
  );