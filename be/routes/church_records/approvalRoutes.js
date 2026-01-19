const express = require('express');
const {
  createApproval,
  getAllApprovals,
  getApprovalById,
  updateApprovalStatus,
  deleteApproval,
  checkMemberApprovalExists,
  checkMemberApprovalStatus
} = require('../../dbHelpers/church_records/approvalRecord');

const router = express.Router();

/**
 * READ ALL - Get approvals with filters/pagination
 * GET /api/church-records/approvals/getAllApprovals
 */
router.get('/getAllApprovals', async (req, res) => {
  try {
    // Get parameters from query string
    const {
      search, limit, offset, page, pageSize, status, type, sortBy, dateRange
    } = req.query;

    // Parse date range if provided
    let parsedDateRange = null;
    if (dateRange) {
      try {
        parsedDateRange = JSON.parse(dateRange);
      } catch (error) {
        console.warn('Invalid date range format:', dateRange);
      }
    }

    const options = {
      search, limit, offset, page, pageSize, status, type, sortBy,
      dateRange: parsedDateRange
    };

    const result = await getAllApprovals(options);
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
        totalCount: result.totalCount,
        summaryStats: result.summaryStats,
        pagination: result.pagination
      });
    }
    return res.status(400).json({
      success: false,
      message: result.message,
      error: result.message
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch approvals'
    });
  }
});

// POST version to support payload filters
router.post('/getAllApprovals', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const {
      search, limit, offset, page, pageSize, status, type, sortBy, dateRange
    } = req.body;

    // Parse date range if provided
    let parsedDateRange = null;
    if (dateRange) {
      try {
        parsedDateRange = JSON.parse(dateRange);
      } catch (error) {
        console.warn('Invalid date range format:', dateRange);
      }
    }

    const options = {
      search, limit, offset, page, pageSize, status, type, sortBy,
      dateRange: parsedDateRange
    };

    const result = await getAllApprovals(options);
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
        totalCount: result.totalCount,
        summaryStats: result.summaryStats,
        pagination: result.pagination
      });
    }
    return res.status(400).json({
      success: false,
      message: result.message,
      error: result.message
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch approvals'
    });
  }
});

/**
 * CREATE - Create a new approval record
 * POST /api/church-records/approvals/createApproval
 */
router.post('/createApproval', async (req, res) => {
  try {
    const approvalData = req.body;
    const result = await createApproval(approvalData);
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: result.message,
      error: result.message
    });
  } catch (error) {
    console.error('Error creating approval:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create approval'
    });
  }
});

/**
 * READ ONE - Get approval by ID
 * GET /api/church-records/approvals/getApprovalById/:id
 */
router.get('/getApprovalById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getApprovalById(id);
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    }
    return res.status(404).json({
      success: false,
      message: result.message,
      error: result.message
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch approval'
    });
  }
});

/**
 * UPDATE - Update approval status
 * PUT /api/church-records/approvals/updateApprovalStatus/:id
 * Body: { status, schedule_date?, schedule_time? }
 * For child dedications: include schedule_date and schedule_time when approving
 */
router.put('/updateApprovalStatus/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, schedule_date, schedule_time } = req.body;

    const result = await updateApprovalStatus(id, status, schedule_date, schedule_time);
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    }
    return res.status(400).json({
      success: false,
      message: result.message,
      error: result.message
    });
  } catch (error) {
    console.error('Error updating approval status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update approval status'
    });
  }
});

/**
 * CHECK - Check if member already has approval/joined
 * GET /api/church-records/approvals/checkMemberApprovalExists
 * Query params: email, type, request_id
 */
router.get('/checkMemberApprovalExists', async (req, res) => {
  try {
    const { email, type, request_id } = req.query;
    const result = await checkMemberApprovalExists(email, type, request_id);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: result.message,
      error: result.message
    });
  } catch (error) {
    console.error('Error checking member approval:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check member approval'
    });
  }
});

/**
 * CHECK - Check member approval status (returns actual status)
 * GET /api/church-records/approvals/checkMemberApprovalStatus
 * Query params: email, type, request_id
 */
router.get('/checkMemberApprovalStatus', async (req, res) => {
  try {
    const { email, type, request_id } = req.query;
    const result = await checkMemberApprovalStatus(email, type, request_id);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: result.message,
      error: result.message
    });
  } catch (error) {
    console.error('Error checking member approval status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check member approval status'
    });
  }
});

/**
 * DELETE - Delete approval
 * DELETE /api/church-records/approvals/deleteApproval/:id
 */
router.delete('/deleteApproval/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const archivedBy = req.user?.acc_id || null;
    const result = await deleteApproval(id, archivedBy);
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    }
    return res.status(404).json({
      success: false,
      message: result.message,
      error: result.message
    });
  } catch (error) {
    console.error('Error deleting approval:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete approval'
    });
  }
});

module.exports = router;

