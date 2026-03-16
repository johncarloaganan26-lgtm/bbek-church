/**
 * Permission Records CRUD Operations
 * Manages role-based permissions for service modules
 * Based on tbl_role_permissions schema
 */

const { query } = require('../../database/db');
const moment = require('moment');

/**
 * GET - Fetch all permissions
 * @returns {Promise<Object>} Result object with permissions array
 */
async function getAllPermissions() {
  try {
    const sql = `
      SELECT * FROM tbl_role_permissions
      ORDER BY role, service_module
    `;
    const [rows] = await query(sql);

    return {
      success: true,
      data: rows || []
    };
  } catch (error) {
    console.error('Error in getAllPermissions:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * GET - Fetch permissions for a specific role
 * @param {String} role - Role name (admin, staff, member)
 * @returns {Promise<Object>} Result object with permissions
 */
async function getPermissionsByRole(role) {
  try {
    const sql = `
      SELECT * FROM tbl_role_permissions
      WHERE role = ?
      ORDER BY service_module
    `;
    const [rows] = await query(sql, [role]);

    return {
      success: true,
      data: rows || []
    };
  } catch (error) {
    console.error('Error in getPermissionsByRole:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * GET - Fetch permission for specific role and service module
 * @param {String} role - Role name
 * @param {String} serviceModule - Service module name
 * @returns {Promise<Object>} Result object with permission details
 */
async function getPermissionByRoleAndModule(role, serviceModule) {
  try {
    const sql = `
      SELECT * FROM tbl_role_permissions
      WHERE role = ? AND service_module = ?
    `;
    const [rows] = await query(sql, [role, serviceModule]);

    return {
      success: true,
      data: rows[0] || null
    };
  } catch (error) {
    console.error('Error in getPermissionByRoleAndModule:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * UPDATE - Update permissions for a role and service module
 * @param {String} role - Role name
 * @param {String} serviceModule - Service module name
 * @param {Object} permissionData - Permission flags {can_view, can_create, can_update, can_delete}
 * @returns {Promise<Object>} Result object
 */
async function updatePermission(role, serviceModule, permissionData) {
  try {
    const { can_view, can_create, can_update, can_delete } = permissionData;

    const sql = `
      UPDATE tbl_role_permissions
      SET can_view = ?, can_create = ?, can_update = ?, can_delete = ?, updated_at = NOW()
      WHERE role = ? AND service_module = ?
    `;

    const [result] = await query(sql, [
      can_view ? 1 : 0,
      can_create ? 1 : 0,
      can_update ? 1 : 0,
      can_delete ? 1 : 0,
      role,
      serviceModule
    ]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: `Permission not found for role '${role}' and module '${serviceModule}'`
      };
    }

    return {
      success: true,
      message: 'Permission updated successfully',
      data: {
        role,
        serviceModule,
        ...permissionData
      }
    };
  } catch (error) {
    console.error('Error in updatePermission:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * CHECK PERMISSION - Check if a role has a specific action permission for a module
 * This is used by route handlers to enforce permissions
 * @param {String} role - Role name (from req.user.position)
 * @param {String} serviceModule - Service module name
 * @param {String} action - Action to check (view, create, update, delete)
 * @returns {Promise<Boolean>} True if permission exists, false otherwise
 */
async function checkPermission(role, serviceModule, action) {
  try {
    // Admin always has all permissions
    if (role.toLowerCase() === 'admin') {
      return true;
    }

    const permissionResult = await getPermissionByRoleAndModule(role, serviceModule);

    if (!permissionResult.success || !permissionResult.data) {
      return false;
    }

    const permission = permissionResult.data;
    const actionField = `can_${action.toLowerCase()}`;

    return permission[actionField] === 1;
  } catch (error) {
    console.error('Error in checkPermission:', error);
    return false;
  }
}

/**
 * RESET PERMISSIONS - Reset permissions for a role to default values
 * @param {String} role - Role name (admin, staff, member)
 * @returns {Promise<Object>} Result object
 */
async function resetPermissionsForRole(role) {
  try {
    const defaultPermissions = {
      admin: { view: 1, create: 1, update: 1, delete: 1 },
      staff: { view: 1, create: 0, update: 0, delete: 0 },
      member: { view: 0, create: 0, update: 0, delete: 0 }
    };

    const defaults = defaultPermissions[role];
    if (!defaults) {
      return {
        success: false,
        message: `Invalid role: ${role}`
      };
    }

    const serviceModules = ['child_dedication', 'water_baptism', 'burial_service', 'discipleship'];

    for (const module of serviceModules) {
      const sql = `
        UPDATE tbl_role_permissions
        SET can_view = ?, can_create = ?, can_update = ?, can_delete = ?, updated_at = NOW()
        WHERE role = ? AND service_module = ?
      `;
      await query(sql, [
        defaults.view,
        defaults.create,
        defaults.update,
        defaults.delete,
        role,
        module
      ]);
    }

    return {
      success: true,
      message: `Permissions reset to defaults for role '${role}'`
    };
  } catch (error) {
    console.error('Error in resetPermissionsForRole:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * GET - Fetch permission summary for admin dashboard
 * Returns groupedpermissions by service module
 * @returns {Promise<Object>} Result object with service modules and their role permissions
 */
async function getPermissionSummary() {
  try {
    const sql = `
      SELECT 
        service_module,
        JSON_OBJECT(
          'admin', JSON_OBJECT(
            'can_view', MAX(CASE WHEN role = 'admin' THEN can_view END),
            'can_create', MAX(CASE WHEN role = 'admin' THEN can_create END),
            'can_update', MAX(CASE WHEN role = 'admin' THEN can_update END),
            'can_delete', MAX(CASE WHEN role = 'admin' THEN can_delete END)
          ),
          'staff', JSON_OBJECT(
            'can_view', MAX(CASE WHEN role = 'staff' THEN can_view END),
            'can_create', MAX(CASE WHEN role = 'staff' THEN can_create END),
            'can_update', MAX(CASE WHEN role = 'staff' THEN can_update END),
            'can_delete', MAX(CASE WHEN role = 'staff' THEN can_delete END)
          ),
          'member', JSON_OBJECT(
            'can_view', MAX(CASE WHEN role = 'member' THEN can_view END),
            'can_create', MAX(CASE WHEN role = 'member' THEN can_create END),
            'can_update', MAX(CASE WHEN role = 'member' THEN can_update END),
            'can_delete', MAX(CASE WHEN role = 'member' THEN can_delete END)
          )
        ) as permissions
      FROM tbl_role_permissions
      GROUP BY service_module
      ORDER BY service_module
    `;
    const [rows] = await query(sql);

    return {
      success: true,
      data: rows || []
    };
  } catch (error) {
    console.error('Error in getPermissionSummary:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

module.exports = {
  getAllPermissions,
  getPermissionsByRole,
  getPermissionByRoleAndModule,
  updatePermission,
  checkPermission,
  resetPermissionsForRole,
  getPermissionSummary
};
