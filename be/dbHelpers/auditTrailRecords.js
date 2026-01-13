const { query } = require('../database/db');

class AuditTrailRecords {
  // Create a new audit log entry
  async createAuditLog(logData) {
    const sql = `
      INSERT INTO tbl_audit_trail (
        user_id, user_email, user_name, user_position,
        action_type, module, description, entity_type, entity_id,
        ip_address, user_agent, old_values, new_values,
        status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      logData.user_id,
      logData.user_email,
      logData.user_name,
      logData.user_position,
      logData.action_type,
      logData.module,
      logData.description,
      logData.entity_type || null,
      logData.entity_id || null,
      logData.ip_address || null,
      logData.user_agent || null,
      logData.old_values ? JSON.stringify(logData.old_values) : null,
      logData.new_values ? JSON.stringify(logData.new_values) : null,
      logData.status || 'success',
      logData.error_message || null
    ];

    const [result] = await query(sql, values);
    return result;
  }

  // Get audit logs with pagination and filters
  async getAuditLogs(page = 1, pageSize = 20, filters = {}) {
    try {
      console.log('getAuditLogs called with:', { page, pageSize, filters });
      const offset = (page - 1) * pageSize;
      console.log('Calculated offset:', offset);

      // Build WHERE clause dynamically
      let whereConditions = [];
      let values = [];

      if (filters.action_type) {
        whereConditions.push('action_type = ?');
        values.push(filters.action_type);
      }

      if (filters.user_id) {
        whereConditions.push('user_id = ?');
        values.push(filters.user_id);
      }

      if (filters.status) {
        whereConditions.push('status = ?');
        values.push(filters.status);
      }

      if (filters.module) {
        whereConditions.push('module LIKE ?');
        values.push(`%${filters.module}%`);
      }

      if (filters.start_date && filters.end_date) {
        whereConditions.push('DATE(date_created) BETWEEN ? AND ?');
        values.push(filters.start_date, filters.end_date);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM tbl_audit_trail ${whereClause}`;
      console.log('Executing count query:', countSql, 'with values:', values);
      const [countRows] = await query(countSql, values);
      console.log('Count result:', countRows);
      const total = Array.isArray(countRows) && countRows.length > 0 && countRows[0].total
        ? countRows[0].total
        : 0;
      console.log('Total count:', total);

      // Get logs with pagination
      const sql = `
        SELECT
          id, user_id, user_email, user_name, user_position,
          action_type, module, description, entity_type, entity_id,
          ip_address, user_agent, old_values, new_values,
          status, error_message, date_created
        FROM tbl_audit_trail
        ${whereClause}
        ORDER BY date_created DESC
        LIMIT ? OFFSET ?
      `;

      values.push(pageSize, offset);
      console.log('Executing logs query:', sql, 'with values:', values);
      const [logs] = await query(sql, values);

      // Process logs to handle Buffer data properly
      const processedLogs = logs.map(log => {
        // Convert description from Buffer to string if needed
        let description = log.description;
        if (Buffer.isBuffer(description)) {
          description = description.toString('utf8');
        } else if (typeof description === 'object' && description !== null) {
          description = JSON.stringify(description);
        }

        // Convert user_agent from Buffer to string if needed
        let userAgent = log.user_agent;
        if (Buffer.isBuffer(userAgent)) {
          userAgent = userAgent.toString('utf8');
        } else if (typeof userAgent === 'object' && userAgent !== null) {
          userAgent = JSON.stringify(userAgent);
        }

        return {
          ...log,
          description: description,
          user_agent: userAgent,
          old_values: log.old_values,
          new_values: log.new_values
        };
      });

      // Get unique users for filter dropdown
      const usersSql = `
        SELECT DISTINCT user_id, user_name, user_email
        FROM tbl_audit_trail
        ORDER BY user_name
      `;
      const [uniqueUsers] = await query(usersSql);

      return {
        logs: processedLogs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          totalPages: Math.ceil(total / pageSize)
        },
        uniqueUsers: uniqueUsers
      };
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      // If table doesn't exist, return empty results
      if (error.message && error.message.includes('tbl_audit_trail')) {
        console.warn('Audit trail table does not exist, returning empty results');
        return {
          logs: [],
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total: 0,
            totalPages: 0
          },
          uniqueUsers: []
        };
      }
      throw error;
    }
  }

  // Export audit logs as CSV
  async exportAuditLogs(filters = {}) {
    // Build WHERE clause (same as getAuditLogs)
    let whereConditions = [];
    let values = [];

    if (filters.action_type) {
      whereConditions.push('action_type = ?');
      values.push(filters.action_type);
    }

    if (filters.user_id) {
      whereConditions.push('user_id = ?');
      values.push(filters.user_id);
    }

    if (filters.status) {
      whereConditions.push('status = ?');
      values.push(filters.status);
    }

    if (filters.module) {
      whereConditions.push('module LIKE ?');
      values.push(`%${filters.module}%`);
    }

    if (filters.start_date && filters.end_date) {
      whereConditions.push('DATE(date_created) BETWEEN ? AND ?');
      values.push(filters.start_date, filters.end_date);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const sql = `
      SELECT
        user_name as 'User Name',
        user_email as 'User Email',
        user_position as 'User Position',
        action_type as 'Action Type',
        module as 'Module',
        description as 'Description',
        date_created as 'Date & Time',
        ip_address as 'IP Address',
        status as 'Status'
      FROM tbl_audit_trail
      ${whereClause}
      ORDER BY date_created DESC
    `;

    const [logs] = await query(sql, values);

    // Convert to CSV
    if (logs.length === 0) {
      return 'No audit logs found for the selected filters.';
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

  // Get audit trail statistics
  async getAuditStats() {
    const stats = {};

    // Total logs count
    const totalSql = 'SELECT COUNT(*) as total FROM tbl_audit_trail';
    const [totalRows] = await query(totalSql);
    stats.totalLogs = Array.isArray(totalRows) && totalRows.length > 0 && totalRows[0].total
      ? totalRows[0].total
      : 0;

    // Logs by action type
    const actionSql = `
      SELECT action_type, COUNT(*) as count
      FROM tbl_audit_trail
      GROUP BY action_type
      ORDER BY count DESC
    `;
    const [actionRows] = await query(actionSql);
    stats.actionStats = actionRows;

    // Logs by status
    const statusSql = `
      SELECT status, COUNT(*) as count
      FROM tbl_audit_trail
      GROUP BY status
    `;
    const [statusRows] = await query(statusSql);
    stats.statusStats = statusRows;

    // Recent activity (last 24 hours)
    const recentSql = `
      SELECT COUNT(*) as recent_count
      FROM tbl_audit_trail
      WHERE date_created >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    const [recentRows] = await query(recentSql);
    stats.recentActivity = Array.isArray(recentRows) && recentRows.length > 0 && recentRows[0].recent_count
      ? recentRows[0].recent_count
      : 0;

    // Most active users
    const userSql = `
      SELECT user_name, user_email, COUNT(*) as activity_count
      FROM tbl_audit_trail
      GROUP BY user_id, user_name, user_email
      ORDER BY activity_count DESC
      LIMIT 10
    `;
    const [userRows] = await query(userSql);
    stats.mostActiveUsers = userRows;

    return stats;
  }

  // Clean up old audit logs (optional utility method)
  async cleanupOldLogs(daysToKeep = 365) {
    const sql = 'DELETE FROM tbl_audit_trail WHERE date_created < DATE_SUB(NOW(), INTERVAL ? DAY)';
    const [result] = await query(sql, [daysToKeep]);
    return result.affectedRows;
  }
}

module.exports = new AuditTrailRecords();
