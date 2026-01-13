const { query } = require('../database/db');

class SystemLogsRecords {
  // Create a new system log entry
  async createLog(logData) {
    const sql = `
      INSERT INTO system_logs (
        user_id, user_name, role, action, page, description, ip_address, device_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      logData.user_id || null,
      logData.user_name,
      logData.role,
      logData.action,
      logData.page,
      logData.description,
      logData.ip_address || null,
      logData.device_info || null
    ];

    const [result] = await query(sql, values);
    return result;
  }

  // Get system logs with pagination and filters
  async getLogs(page = 1, pageSize = 20, filters = {}) {
    try {
      const offset = (page - 1) * pageSize;

      // Build WHERE clause dynamically
      let whereConditions = [];
      let values = [];

      if (filters.action) {
        whereConditions.push('action = ?');
        values.push(filters.action);
      }

      if (filters.user_id) {
        whereConditions.push('user_id = ?');
        values.push(filters.user_id);
      }

      if (filters.role) {
        whereConditions.push('role = ?');
        values.push(filters.role);
      }

      if (filters.page) {
        whereConditions.push('page LIKE ?');
        values.push(`%${filters.page}%`);
      }

      if (filters.start_date && filters.end_date) {
        whereConditions.push('DATE(date_time) BETWEEN ? AND ?');
        values.push(filters.start_date, filters.end_date);
      }

      if (filters.search) {
        whereConditions.push('(user_name LIKE ? OR description LIKE ? OR page LIKE ?)');
        values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count (use a copy of values to avoid parameter mismatch)
      const countSql = `SELECT COUNT(*) as total FROM system_logs ${whereClause}`;
      const countRows = await query(countSql, whereClause.trim() ? [...values] : []);
      const total = countRows[0].total;

      // Get logs with pagination
      const sql = `
        SELECT
          log_id, user_id, user_name, role, action, page, description, ip_address, device_info, date_time
        FROM system_logs
        ${whereClause}
        ORDER BY date_time DESC
        LIMIT ? OFFSET ?
      `;

      values.push(pageSize, offset);
      const logs = await query(sql, values);

      // Get unique users for filter dropdown
      const usersSql = `
        SELECT DISTINCT user_id, user_name
        FROM system_logs
        WHERE user_id IS NOT NULL
        ORDER BY user_name
      `;
      const uniqueUsers = await query(usersSql);

      // Get unique roles
      const rolesSql = `
        SELECT DISTINCT role
        FROM system_logs
        ORDER BY role
      `;
      const uniqueRoles = await query(rolesSql);

      // Get unique pages
      const pagesSql = `
        SELECT DISTINCT page
        FROM system_logs
        ORDER BY page
      `;
      const uniquePages = await query(pagesSql);

      return {
        logs: logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          totalPages: Math.ceil(total / pageSize)
        },
        filters: {
          uniqueUsers: uniqueUsers,
          uniqueRoles: uniqueRoles.map(r => r.role),
          uniquePages: uniquePages.map(p => p.page)
        }
      };
    } catch (error) {
      console.error('Error in getLogs:', error);
      // If table doesn't exist, return empty results
      if (error.message && error.message.includes('system_logs')) {
        console.warn('System logs table does not exist, returning empty results');
        return {
          logs: [],
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total: 0,
            totalPages: 0
          },
          filters: {
            uniqueUsers: [],
            uniqueRoles: [],
            uniquePages: []
          }
        };
      }
      throw error;
    }
  }

  // Export system logs as CSV
  async exportLogs(filters = {}) {
    // Build WHERE clause (same as getLogs)
    let whereConditions = [];
    let values = [];

    if (filters.action) {
      whereConditions.push('action = ?');
      values.push(filters.action);
    }

    if (filters.user_id) {
      whereConditions.push('user_id = ?');
      values.push(filters.user_id);
    }

    if (filters.role) {
      whereConditions.push('role = ?');
      values.push(filters.role);
    }

    if (filters.page) {
      whereConditions.push('page LIKE ?');
      values.push(`%${filters.page}%`);
    }

    if (filters.start_date && filters.end_date) {
      whereConditions.push('DATE(date_time) BETWEEN ? AND ?');
      values.push(filters.start_date, filters.end_date);
    }

    if (filters.search) {
      whereConditions.push('(user_name LIKE ? OR description LIKE ? OR page LIKE ?)');
      values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const sql = `
      SELECT
        user_name as 'User Name',
        role as 'Role',
        action as 'Action',
        page as 'Page',
        description as 'Description',
        date_time as 'Date & Time',
        ip_address as 'IP Address'
      FROM system_logs
      ${whereClause}
      ORDER BY date_time DESC
    `;

    const [logs] = await query(sql, values);

    // Convert to CSV
    if (logs.length === 0) {
      return 'No system logs found for the selected filters.';
    }

    const headers = Object.keys(logs[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    logs.forEach(log => {
      const row = headers.map(header => {
        const value = log[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Delete old logs (for maintenance)
  async deleteOldLogs(daysToKeep = 365) {
    const sql = 'DELETE FROM system_logs WHERE date_time < DATE_SUB(NOW(), INTERVAL ? DAY)';
    const [result] = await query(sql, [daysToKeep]);
    return result.affectedRows;
  }

  // Get logs statistics
  async getStats() {
    const stats = {};

    // Total logs count
    const totalSql = 'SELECT COUNT(*) as total FROM system_logs';
    const [totalRows] = await query(totalSql);
    stats.totalLogs = totalRows[0].total;

    // Logs by action type
    const actionSql = `
      SELECT action, COUNT(*) as count
      FROM system_logs
      GROUP BY action
      ORDER BY count DESC
    `;
    const [actionRows] = await query(actionSql);
    stats.actionStats = actionRows;

    // Logs by role
    const roleSql = `
      SELECT role, COUNT(*) as count
      FROM system_logs
      GROUP BY role
      ORDER BY count DESC
    `;
    const [roleRows] = await query(roleSql);
    stats.roleStats = roleRows;

    // Recent activity (last 24 hours)
    const recentSql = `
      SELECT COUNT(*) as recent_count
      FROM system_logs
      WHERE date_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    const [recentRows] = await query(recentSql);
    stats.recentActivity = recentRows[0].recent_count;

    return stats;
  }
}

module.exports = new SystemLogsRecords();