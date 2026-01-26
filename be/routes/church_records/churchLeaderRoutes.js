const express = require('express');
const moment = require('moment');
const {
  createChurchLeader,
  getAllChurchLeaders,
  getChurchLeaderById,
  getChurchLeaderByMemberId,
  updateChurchLeader,
  deleteChurchLeader,
  bulkDeleteChurchLeaders,
  exportChurchLeadersToExcel
} = require('../../dbHelpers/church_records/churchLeaderRecords');

const { getAllPastorsForSelect } = require('../../dbHelpers/church_records/memberRecords');

const router = express.Router();

/**
 * CREATE - Insert a new church leader record
 * POST /api/church-records/church-leaders/createChurchLeader
 * Body: { leader_id?, member_id, joined_date, date_created? }
 */
router.post('/createChurchLeader', async (req, res) => {
  try {
    const result = await createChurchLeader(req.body);
    
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
        error: result.error || result.message,
        duplicateDetails: result.duplicateDetails
      });
    }
  } catch (error) {
    console.error('Error creating church leader:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create church leader'
    });
  }
});

/**
 * READ ALL - Get all church leader records with pagination and filters
 * GET /api/church-records/church-leaders/getAllChurchLeaders (query params)
 * POST /api/church-records/church-leaders/getAllChurchLeaders (body payload)
 * Parameters: search, limit, offset, page, pageSize, sortBy, dateRange
 */
router.get('/getAllChurchLeaders', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllChurchLeaders(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching church leaders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch church leaders'
    });
  }
});

router.post('/getAllChurchLeaders', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllChurchLeaders(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching church leaders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch church leaders'
    });
  }
});

/**
 * READ ONE - Get a single church leader by ID
 * GET /api/church-records/church-leaders/getChurchLeaderById/:id
 */
router.get('/getChurchLeaderById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leaderId = parseInt(id);

    if (isNaN(leaderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leader ID'
      });
    }

    const result = await getChurchLeaderById(leaderId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching church leader:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch church leader'
    });
  }
});

/**
 * READ ONE - Get a single church leader by member_id
 * GET /api/church-records/church-leaders/getChurchLeaderByMemberId/:memberId
 */
router.get('/getChurchLeaderByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'Member ID is required'
      });
    }

    const result = await getChurchLeaderByMemberId(memberId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching church leader:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch church leader'
    });
  }
});

/**
 * UPDATE - Update an existing church leader record
 * PUT /api/church-records/church-leaders/updateChurchLeader/:id
 * Body: { member_id?, joined_date?, date_created? }
 */
router.put('/updateChurchLeader/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leaderId = parseInt(id);

    if (isNaN(leaderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leader ID'
      });
    }

    const result = await updateChurchLeader(leaderId, req.body);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error || result.message,
        duplicateDetails: result.duplicateDetails
      });
    }
  } catch (error) {
    console.error('Error updating church leader:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update church leader'
    });
  }
});

/**
 * DELETE - Delete a church leader record
 * DELETE /api/church-records/church-leaders/deleteChurchLeader/:id
 */
router.delete('/deleteChurchLeader/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leaderId = parseInt(id);

    if (isNaN(leaderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leader ID'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteChurchLeader(leaderId, archivedBy);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error deleting church leader:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete church leader'
    });
  }
});

/**
 * BULK DELETE CHURCH LEADERS - Permanently delete multiple church leader records
 * DELETE /api/church-records/church-leaders/bulkDeleteChurchLeaders
 * Body: { leader_ids: [1, 2, 3] }
 */
router.delete('/bulkDeleteChurchLeaders', async (req, res) => {
  try {
    const { leader_ids } = req.body;

    if (!leader_ids || !Array.isArray(leader_ids) || leader_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Leader IDs array is required and cannot be empty',
        message: 'Please provide an array of leader IDs to delete'
      });
    }

    // Convert string IDs to numbers and validate
    const leaderIds = leader_ids.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);

    if (leaderIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid leader IDs provided',
        message: 'All provided leader IDs must be valid numbers'
      });
    }

    // Skip audit trail for bulk operations to improve performance
    req.skipAuditTrail = true;

    const result = await bulkDeleteChurchLeaders(leaderIds, req.user?.acc_id);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error bulk deleting church leaders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete church leaders'
    });
  }
});

/**
 * EXPORT - Export church leader records to Excel
 * GET /api/church-records/church-leaders/exportExcel (query params)
 * POST /api/church-records/church-leaders/exportExcel (body payload)
 * Parameters: search, sortBy (same as getAllChurchLeaders, but no pagination)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const excelBuffer = await exportChurchLeadersToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `church_leaders_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting church leaders to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export church leaders to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const excelBuffer = await exportChurchLeadersToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `church_leaders_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting church leaders to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export church leaders to Excel'
    });
  }
});

/**
 * GET ALL MEMBERS FOR SELECT - Get all members for ministry leader dropdowns
 * This returns ONLY members with 'pastor' in their position
 * GET /api/church-records/church-leaders/getAllChurchLeadersForSelect
 */
router.get('/getAllChurchLeadersForSelect', async (req, res) => {
  try {
    const result = await getAllPastorsForSelect();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Pastors retrieved successfully for leader selection',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching pastors for leader selection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pastors for leader selection'
    });
  }
});

module.exports = router;

