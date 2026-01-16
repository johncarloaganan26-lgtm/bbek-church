const express = require('express');
const moment = require('moment');
const {
  createMarriageService,
  getAllMarriageServices,
  getMarriageServiceById,
  getMarriageServicesByGroomMemberId,
  getMarriageServicesByBrideMemberId,
  updateMarriageService,
  deleteMarriageService,
  exportMarriageServicesToExcel
} = require('../../dbHelpers/services/marriageServiceRecords');

const router = express.Router();

/**
 * CREATE - Insert a new marriage service record
 * POST /api/services/marriage-services/createMarriageService
 * Body: { marriage_id?, groom_member_id, bride_member_id, guardians (array), pastor_id, location, marriage_date, status?, date_created? }
 */
router.post('/createMarriageService', async (req, res) => {
  try {
    const result = await createMarriageService(req.body);
    
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
    console.error('Error creating marriage service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create marriage service'
    });
  }
});

/**
 * READ ALL - Get all marriage service records with pagination and filters
 * GET /api/services/marriage-services/getAllMarriageServices (query params)
 * POST /api/services/marriage-services/getAllMarriageServices (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, sortBy
 */
router.get('/getAllMarriageServices', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllMarriageServices(options);
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
    console.error('Error fetching marriage services:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch marriage services'
    });
  }
});

router.post('/getAllMarriageServices', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllMarriageServices(options);
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
    console.error('Error fetching marriage services:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch marriage services'
    });
  }
});

/**
 * READ ONE - Get a single marriage service by ID
 * GET /api/services/marriage-services/getMarriageServiceById/:id
 */
router.get('/getMarriageServiceById/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Marriage ID is required'
      });
    }

    const result = await getMarriageServiceById(id);
    
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
    console.error('Error fetching marriage service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch marriage service'
    });
  }
});

/**
 * READ - Get marriage services by groom member ID
 * GET /api/services/marriage-services/getMarriageServicesByGroomMemberId/:groomMemberId
 */
router.get('/getMarriageServicesByGroomMemberId/:groomMemberId', async (req, res) => {
  try {
    const { groomMemberId } = req.params;

    if (!groomMemberId) {
      return res.status(400).json({
        success: false,
        error: 'Groom Member ID is required'
      });
    }

    const result = await getMarriageServicesByGroomMemberId(groomMemberId);
    
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
    console.error('Error fetching marriage services by groom member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch marriage services'
    });
  }
});

/**
 * READ - Get marriage services by bride member ID
 * GET /api/services/marriage-services/getMarriageServicesByBrideMemberId/:brideMemberId
 */
router.get('/getMarriageServicesByBrideMemberId/:brideMemberId', async (req, res) => {
  try {
    const { brideMemberId } = req.params;

    if (!brideMemberId) {
      return res.status(400).json({
        success: false,
        error: 'Bride Member ID is required'
      });
    }

    const result = await getMarriageServicesByBrideMemberId(brideMemberId);
    
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
    console.error('Error fetching marriage services by bride member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch marriage services'
    });
  }
});

/**
 * UPDATE - Update an existing marriage service record
 * PUT /api/services/marriage-services/updateMarriageService/:id
 * Body: { groom_member_id?, bride_member_id?, guardians (array)?, pastor_id?, location?, marriage_date?, status?, date_created? }
 */
router.put('/updateMarriageService/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Marriage ID is required'
      });
    }

    const result = await updateMarriageService(id, req.body);
    
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
    console.error('Error updating marriage service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update marriage service'
    });
  }
});

/**
 * DELETE - Delete a marriage service record
 * DELETE /api/services/marriage-services/deleteMarriageService/:id
 */
router.delete('/deleteMarriageService/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Marriage ID is required'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteMarriageService(id, archivedBy);
    
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
    console.error('Error deleting marriage service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete marriage service'
    });
  }
});

/**
 * EXPORT - Export marriage service records to Excel
 * GET /api/services/marriage-services/exportExcel (query params)
 * POST /api/services/marriage-services/exportExcel (body payload)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    const options = req.query;
    const excelBuffer = await exportMarriageServicesToExcel(options);
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `marriage_services_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting marriage services to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export marriage services to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    const options = req.body;
    const excelBuffer = await exportMarriageServicesToExcel(options);
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `marriage_services_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting marriage services to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export marriage services to Excel'
    });
  }
});

module.exports = router;

