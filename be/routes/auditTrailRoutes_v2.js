const express = require('express');
const {
  createAuditLog,
  getAllAuditLogs,
  getAuditLogById,
  deleteAuditLogsBefore,
  getAuditStats
} = require('../dbHelpers/auditTrailRecords_v2');

const router = express.Router();

/**
 * CREATE - Create audit log entry (for manual logging)
 * POST /api/audit-trail/create
 */
router.post('/create', async (req, res) => {
  try {
    const result = await createAuditLog(req.body);
    
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
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create audit log'
    });
  }
});

/**
 * READ ALL - Get all audit logs with pagination and filters
 * GET /api/audit-trail/getAll
 * POST /api/audit-trail/getAll
 */
router.get('/getAll', async (req, res) => {
  try {
    const options = req.query;
    const result = await getAllAuditLogs(options);
    
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
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch audit logs'
    });
  }
});

router.post('/getAll', async (req, res) => {
  try {
    const options = req.body;
    const result = await getAllAuditLogs(options);
    
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
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch audit logs'
    });
  }
});

/**
 * READ ONE - Get single audit log by ID
 * GET /api/audit-trail/getById/:id
 */
router.get('/getById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const auditId = parseInt(id);

    if (isNaN(auditId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audit ID'
      });
    }

    const result = await getAuditLogById(auditId);
    
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
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch audit log'
    });
  }
});

/**
 * GET STATS - Get audit log statistics
 * GET /api/audit-trail/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await getAuditStats();
    
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
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch audit stats'
    });
  }
});

/**
 * DELETE - Delete old audit logs
 * DELETE /api/audit-trail/deleteOld
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

    const result = await deleteAuditLogsBefore(date_before);
    
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
    console.error('Error deleting audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete audit logs'
    });
  }
});

module.exports = router;
