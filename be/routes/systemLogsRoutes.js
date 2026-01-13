const express = require('express');
const router = express.Router();
const systemLogsRecords = require('../dbHelpers/systemLogsRecords');
const { authenticateToken } = require('../middleware/authMiddleware');

// All system logs routes require authentication
router.use(authenticateToken);

// TEMPORARILY DISABLED ADMIN REQUIREMENT FOR TESTING
// Middleware to check if user is admin
// const requireAdmin = (req, res, next) => {
//   if (!req.user || (req.user.account?.position !== 'admin' && req.user.position !== 'admin')) {
//     return res.status(403).json({
//       success: false,
//       error: 'Access Denied',
//       message: 'Administrator access required'
//     });
//   }
//   next();
// };

// router.use(requireAdmin);

// GET /api/system-logs/logs - Fetch system logs with pagination and filters
router.get('/logs', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      action,
      userId,
      role,
      page: pageFilter,
      dateRange,
      search
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
      action: action,
      user_id: userId,
      role: role,
      page: pageFilter,
      start_date: startDate,
      end_date: endDate,
      search: search
    };

    const result = await systemLogsRecords.getLogs(
      parseInt(page),
      parseInt(pageSize),
      filters
    );

    res.json({
      success: true,
      data: {
        logs: result.logs,
        pagination: result.pagination,
        filters: result.filters
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'Failed to fetch system logs'
    });
  }
});

// POST /api/system-logs/log - Create a new system log entry
router.post('/log', async (req, res) => {
  try {
    const logData = req.body;

    // Validate required fields
    const requiredFields = ['user_name', 'role', 'action', 'page', 'description'];
    for (const field of requiredFields) {
      if (!logData[field]) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Missing required field: ${field}`
        });
      }
    }

    // Add IP address if not provided
    if (!logData.ip_address) {
      logData.ip_address = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    }

    // Add device info if not provided
    if (!logData.device_info) {
      logData.device_info = req.get('User-Agent') || 'unknown';
    }

    const result = await systemLogsRecords.createLog(logData);

    res.json({
      success: true,
      data: { logId: result.insertId },
      message: 'System log created successfully'
    });
  } catch (error) {
    console.error('Error creating system log:', error);
    res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'Failed to create system log'
    });
  }
});

// GET /api/system-logs/export - Export system logs as CSV
router.get('/export', async (req, res) => {
  try {
    const {
      action,
      userId,
      role,
      page: pageFilter,
      dateRange,
      search
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
      action: action,
      user_id: userId,
      role: role,
      page: pageFilter,
      start_date: startDate,
      end_date: endDate,
      search: search
    };

    const csvData = await systemLogsRecords.exportLogs(filters);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="system_logs_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvData);
  } catch (error) {
    console.error('Error exporting system logs:', error);
    res.status(500).json({
      success: false,
      error: 'Export Error',
      message: 'Failed to export system logs'
    });
  }
});

// DELETE /api/system-logs/cleanup - Delete old logs (admin maintenance)
router.delete('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 365 } = req.body;

    if (daysToKeep < 30) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Minimum retention period is 30 days'
      });
    }

    const deletedCount = await systemLogsRecords.deleteOldLogs(daysToKeep);

    res.json({
      success: true,
      data: { deletedCount },
      message: `Successfully deleted ${deletedCount} old log entries`
    });
  } catch (error) {
    console.error('Error cleaning up system logs:', error);
    res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'Failed to cleanup system logs'
    });
  }
});

// GET /api/system-logs/stats - Get system logs statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await systemLogsRecords.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching system logs stats:', error);
    res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'Failed to fetch system logs statistics'
    });
  }
});

module.exports = router;