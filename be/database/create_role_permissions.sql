-- Create Role Permissions Table for Staff Permission Control
-- This table defines what actions staff members can perform on each service module

CREATE TABLE IF NOT EXISTS `tbl_role_permissions` (
  `permission_id` INT NOT NULL AUTO_INCREMENT COMMENT 'Unique permission ID',
  `role` VARCHAR(45) NOT NULL COMMENT 'Staff role (admin, staff, member)',
  `service_module` VARCHAR(100) NOT NULL COMMENT 'Service module name (child_dedication, water_baptism, burial_service, discipleship/salvation, etc.)',
  `can_view` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Can view records (1=yes, 0=no)',
  `can_create` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Can create new records (1=yes, 0=no)',
  `can_update` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Can edit/update records (1=yes, 0=no)',
  `can_delete` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Can delete records (1=yes, 0=no)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When this permission was created',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When this permission was last updated',
  
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `unique_role_service` (`role`, `service_module`),
  INDEX `idx_role` (`role`),
  INDEX `idx_service_module` (`service_module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Staff role permissions for service modules';

-- Insert default permissions for ADMIN role (can do everything)
INSERT IGNORE INTO `tbl_role_permissions` 
(`role`, `service_module`, `can_view`, `can_create`, `can_update`, `can_delete`, `created_at`, `updated_at`)
VALUES 
('admin', 'child_dedication', 1, 1, 1, 1, NOW(), NOW()),
('admin', 'water_baptism', 1, 1, 1, 1, NOW(), NOW()),
('admin', 'burial_service', 1, 1, 1, 1, NOW(), NOW()),
('admin', 'discipleship', 1, 1, 1, 1, NOW(), NOW());

-- Insert default permissions for STAFF role (view only for all services initially - can be modified by admin)
INSERT IGNORE INTO `tbl_role_permissions` 
(`role`, `service_module`, `can_view`, `can_create`, `can_update`, `can_delete`, `created_at`, `updated_at`)
VALUES 
('staff', 'child_dedication', 1, 0, 0, 0, NOW(), NOW()),
('staff', 'water_baptism', 1, 0, 0, 0, NOW(), NOW()),
('staff', 'burial_service', 1, 0, 0, 0, NOW(), NOW()),
('staff', 'discipleship', 1, 0, 0, 0, NOW(), NOW());

-- Insert default permissions for MEMBER role (no access to service management)
INSERT IGNORE INTO `tbl_role_permissions` 
(`role`, `service_module`, `can_view`, `can_create`, `can_update`, `can_delete`, `created_at`, `updated_at`)
VALUES 
('member', 'child_dedication', 0, 0, 0, 0, NOW(), NOW()),
('member', 'water_baptism', 0, 0, 0, 0, NOW(), NOW()),
('member', 'burial_service', 0, 0, 0, 0, NOW(), NOW()),
('member', 'discipleship', 0, 0, 0, 0, NOW(), NOW());
