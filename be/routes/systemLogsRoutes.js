const express = require('express');
const {
  createSystemLog,
  getAllSystemLogs,
  getSystemLogById,
  deleteSystemLogsBefore,
  getSystemLogsStats
} = require('../dbHelpers/systemLogsRecords');

const router = express.Router();

/**
 * CREATE - Create system log entry (for manual logging)
 * POST /api/system-logs/create
 */
router.post('/create', async (req, res) => {
  try {
    const result = await createSystemLog(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating system log:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create system log'
    });
  }
});

/**
 * READ ALL - Get all system logs with pagination and filters
 * GET /api/system-logs/getAll
 * POST /api/system-logs/getAll
 */
router.get('/getAll', async (req, res) => {
  try {
    const options = req.query;
    const result = await getAllSystemLogs(options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
        totalCount: result.totalCount,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch system logs'
    });
  }
});

router.post('/getAll', async (req, res) => {
  try {
    const options = req.body;
    const result = await getAllSystemLogs(options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
        totalCount: result.totalCount,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch system logs'
    });
  }
});

/**
 * READ ONE - Get single system log by ID
 * GET /api/system-logs/getById/:id
 */
router.get('/getById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const logId = parseInt(id);

    if (isNaN(logId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid log ID'
      });
    }

    const result = await getSystemLogById(logId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching system log:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch system log'
    });
  }
});

/**
 * GET STATS - Get system logs statistics
 * GET /api/system-logs/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await getSystemLogsStats();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching system logs stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch system logs stats'
    });
  }
});

/**
 * DELETE - Delete old system logs
 * DELETE /api/system-logs/deleteOld
 */
router.delete('/deleteOld', async (req, res) => {
  try {
    const { date_before } = req.body;
    
    if (!date_before) {
      return res.status(400).json({
        success: false,
        error: 'Date is required (format: YYYY-MM-DD)'
      });
    }

    const result = await deleteSystemLogsBefore(date_before);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error deleting system logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete system logs'
    });
  }
});

module.exports = router;
