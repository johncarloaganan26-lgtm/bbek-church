const express = require('express');
const router = express.Router();
const auditTrailRecords = require('../dbHelpers/auditTrailRecords');
const { authenticateToken } = require('../middleware/authMiddleware');

// All audit trail routes require authentication
router.use(authenticateToken);

// GET /api/audit-trail/logs - Fetch audit logs with pagination and filters
router.get('/logs', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      actionType,
      userId,
      dateRange,
      status,
      module
    } = req.query;

    // Parse date range if provided
    let startDate = null;
    let endDate = null;
    if (dateRange) {
      try {
        const [start, end] = JSON.parse(dateRange);
        startDate = start;
        endDate = end;
      } catch (error) {
        console.warn('Invalid date range format:', dateRange);
      }
    }

    const filters = {
      action_type: actionType,
      user_id: userId,
      status: status,
      module: module,
      start_date: startDate,
      end_date: endDate
    };

    const result = await auditTrailRecords.getAuditLogs(
      parseInt(page),
      parseInt(pageSize),
      filters
    );

    res.json({
      success: true,
      data: {
        logs: result.logs,
        pagination: result.pagination,
        uniqueUsers: result.uniqueUsers
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'Failed to fetch audit logs'
    });
  }
});

// POST /api/audit-trail/log - Create a new audit log entry
router.post('/log', async (req, res) => {
  try {
    const logData = req.body;

    // Validate required fields
    const requiredFields = ['user_id', 'user_email', 'user_name', 'user_position', 'action_type', 'module', 'description'];
    for (const field of requiredFields) {
      if (!logData[field]) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Missing required field: ${field}`
        });
      }
    }

    // Add timestamp and IP address
    logData.date_created = new Date().toISOString();
    logData.ip_address = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';

    const result = await auditTrailRecords.createAuditLog(logData);

    res.json({
      success: true,
      data: { logId: result.insertId },
      message: 'Audit log created successfully'
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'Failed to create audit log'
    });
  }
});

// GET /api/audit-trail/export - Export audit logs as CSV
router.get('/export', async (req, res) => {
  try {
    const {
      actionType,
      userId,
      dateRange,
      status,
      module
    } = req.query;

    // Parse date range if provided
    let startDate = null;
    let endDate = null;
    if (dateRange) {
      try {
        const [start, end] = JSON.parse(dateRange);
        startDate = start;
        endDate = end;
      } catch (error) {
        console.warn('Invalid date range format:', dateRange);
      }
    }

    const filters = {
      action_type: actionType,
      user_id: userId,
      status: status,
      module: module,
      start_date: startDate,
      end_date: endDate
    };

    const csvData = await auditTrailRecords.exportAuditLogs(filters);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_trail_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvData);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Export Error',
      message: 'Failed to export audit logs'
    });
  }
});

// GET /api/audit-trail/stats - Get audit trail statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await auditTrailRecords.getAuditStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'Failed to fetch audit statistics'
    });
  }
});

module.exports = router;