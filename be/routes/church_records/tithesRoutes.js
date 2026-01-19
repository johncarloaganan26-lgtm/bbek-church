const express = require('express');
const moment = require('moment');
const {
  createTithe,
  getAllTithes,
  getTitheById,
  getTitheByMemberId,
  updateTithe,
  deleteTithe,
  exportTithesToExcel
} = require('../../dbHelpers/church_records/tithesRecords');

const router = express.Router();

/**
 * CREATE - Insert a new tithe record
 * POST /api/church-records/tithes/createTithe
 * Body: { tithes_id?, member_id, amount, type, payment_method, notes?, status?, date_created? }
 */
router.post('/createTithe', async (req, res) => {
  try {
    const result = await createTithe(req.body);
    
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
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error creating tithe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tithe'
    });
  }
});

/**
 * READ ALL - Get all tithe records with pagination and filters
 * GET /api/church-records/tithes/getAllTithes (query params)
 * POST /api/church-records/tithes/getAllTithes (body payload)
 * Parameters: search, limit, offset, page, pageSize, type, status, sortBy, dateRange
 */
router.get('/getAllTithes', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllTithes(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        summaryStats: result.summaryStats, // Summary statistics from all records
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
    console.error('Error fetching tithes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tithes'
    });
  }
});

router.post('/getAllTithes', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllTithes(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        summaryStats: result.summaryStats, // Summary statistics from all records
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
    console.error('Error fetching tithes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tithes'
    });
  }
});

/**
 * READ ONE - Get a single tithe by ID
 * GET /api/church-records/tithes/getTitheById/:id
 */
router.get('/getTitheById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    const result = await getTitheById(tithesId);
    
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
    console.error('Error fetching tithe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tithe'
    });
  }
});

/**
 * READ ONE - Get a single tithe by member_id
 * GET /api/church-records/tithes/getTitheByMemberId/:memberId
 */
router.get('/getTitheByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'Member ID is required'
      });
    }

    const result = await getTitheByMemberId(memberId);
    
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
    console.error('Error fetching tithe by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tithe'
    });
  }
});

/**
 * UPDATE - Update an existing tithe record
 * PUT /api/church-records/tithes/updateTithe/:id
 * Body: { member_id?, amount?, type?, payment_method?, notes?, status?, date_created? }
 */
router.put('/updateTithe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    const result = await updateTithe(tithesId, req.body);
    
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
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error updating tithe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tithe'
    });
  }
});

/**
 * DELETE - Delete a tithe record
 * DELETE /api/church-records/tithes/deleteTithe/:id
 */
router.delete('/deleteTithe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tithesId = parseInt(id);

    if (isNaN(tithesId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tithes ID'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteTithe(tithesId, archivedBy);
    
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
    console.error('Error deleting tithe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete tithe'
    });
  }
});

/**
 * EXPORT - Export tithe records to Excel
 * GET /api/church-records/tithes/exportExcel (query params)
 * POST /api/church-records/tithes/exportExcel (body payload)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const excelBuffer = await exportTithesToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `tithes_offerings_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting tithes to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export tithes to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const excelBuffer = await exportTithesToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `tithes_offerings_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting tithes to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export tithes to Excel'
    });
  }
});

module.exports = router;

