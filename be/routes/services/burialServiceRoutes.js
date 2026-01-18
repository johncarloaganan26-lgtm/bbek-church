const express = require('express');
const moment = require('moment');
const {
  createBurialService,
  getAllBurialServices,
  getBurialServiceById,
  getBurialServicesByMemberId,
  updateBurialService,
  deleteBurialService,
  exportBurialServicesToExcel,
  searchBurialServicesFulltext,
  analyzeBurialServiceAvailability
} = require('../../dbHelpers/services/burialServiceRecords');
const dateFormattingMiddleware = require('../../middleware/dateFormattingMiddleware');

const router = express.Router();

// Apply date formatting middleware to all burial service routes
router.use(dateFormattingMiddleware);

/**
 * CHECK TIME SLOT - Check if a time slot is already booked for burial service
 * GET /api/church-records/burial-services/check-time-slot?service_date=YYYY-MM-DD&service_time=HH:mm:ss&exclude_id=xxx
 * This prevents double-booking of burial service time slots (same day allowed, same time blocked)
 */
router.get('/check-time-slot', async (req, res) => {
  try {
    const { service_date, service_time, exclude_id } = req.query;

    if (!service_date || !service_time) {
      return res.status(400).json({
        success: false,
        message: 'Service date and time are required'
      });
    }

    // Query to check for existing approved burial services at the same date and time
    let sql = `
      SELECT burial_id, requester_name, deceased_name, service_date, status
      FROM tbl_burialservice
      WHERE DATE(service_date) = ?
      AND TIME(service_date) = ?
      AND status = 'approved'
    `;

    const params = [service_date, service_time];

    // Exclude current burial if editing
    if (exclude_id) {
      sql += ' AND burial_id != ?';
      params.push(exclude_id);
    }

    const db = require('../../database/db');
    const [rows] = await db.query(sql, params);

    if (rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Time slot is already booked',
        data: {
          isBooked: true,
          conflictingBurial: {
            burial_id: rows[0].burial_id,
            requester_name: rows[0].requester_name,
            deceased_name: rows[0].deceased_name,
            service_date: rows[0].service_date,
            status: rows[0].status
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Time slot is available',
      data: { isBooked: false }
    });
  } catch (error) {
    console.error('Error checking time slot:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check time slot'
    });
  }
});

/**
 * CHECK DUPLICATE - Check if burial service already exists
 * GET /api/church-records/burial-services/check-duplicate
 * Query params: member_id, deceased_name, deceased_birthdate, exclude_burial_id (optional)
 */
router.get('/check-duplicate', async (req, res) => {
  try {
    const { member_id, deceased_name, deceased_birthdate, exclude_burial_id } = req.query;

    if (!member_id || !deceased_name || !deceased_birthdate) {
      return res.status(400).json({
        success: false,
        message: 'member_id, deceased_name, and deceased_birthdate are required'
      });
    }

    const db = require('../../database/db');
    const query = `
      SELECT burial_id, member_id, deceased_name, deceased_birthdate, date_death, status
      FROM tbl_burialservice
      WHERE member_id = ?
        AND deceased_name = ?
        AND deceased_birthdate = ?
        AND status != 'Deleted'
        ${exclude_burial_id ? 'AND burial_id != ?' : ''}
    `;

    const params = exclude_burial_id
      ? [member_id, deceased_name, deceased_birthdate, exclude_burial_id]
      : [member_id, deceased_name, deceased_birthdate];

    const [rows] = await db.query(query, params);

    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A burial service request for this deceased person with the same name and birthdate already exists from this member',
        data: { exists: true, burial: rows[0] }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'No duplicate found',
      data: { exists: false }
    });
  } catch (error) {
    console.error('Error checking duplicate burial service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check duplicate'
    });
  }
});

/**
 * CHECK MEMBER HAS BURIAL - Check if member already has a burial service request
 * GET /api/church-records/burial-services/check-member-burial/:memberId
 */
router.get('/check-member-burial/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }
    
    const result = await getBurialServicesByMemberId(memberId);
    
    if (result.success && result.data && result.data.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Member already has burial service requests',
        data: { hasBurial: true, burials: result.data }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Member has no existing burial service requests',
      data: { hasBurial: false }
    });
  } catch (error) {
    console.error('Error checking member burial:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check member burial'
    });
  }
});

/**
 * CREATE - Insert a new burial service record
 * POST /api/church-records/burial-services/createBurialService
 * Body: { burial_id?, member_id, requestor, relationship, location, pastor_id, service_date, status?, date_created? }
 */
router.post('/createBurialService', async (req, res) => {
  try {
    const result = await createBurialService(req.body);
    
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
    console.error('Error creating burial service:', error);
    
    // Provide more detailed error message for debugging
    let errorMessage = error.message || 'Failed to create burial service';
    
    // Handle specific database constraint errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
      errorMessage = 'Invalid member ID or database constraint violation. Please ensure the member exists or provide non-member requester details.';
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      errorMessage = 'Missing required field. Please ensure all required fields are provided.';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

/**
 * READ ALL - Get all burial service records with pagination and filters
 * GET /api/church-records/burial-services/getAllBurialServices (query params)
 * POST /api/church-records/burial-services/getAllBurialServices (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, sortBy
 */
router.get('/getAllBurialServices', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllBurialServices(options);
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
    console.error('Error fetching burial services:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch burial services'
    });
  }
});

router.post('/getAllBurialServices', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllBurialServices(options);
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
    console.error('Error fetching burial services:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch burial services'
    });
  }
});

/**
 * READ - Get burial services by member_id
 * GET /api/church-records/burial-services/getBurialServicesByMemberId/:memberId
 */
router.get('/getBurialServicesByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'Member ID is required'
      });
    }

    const result = await getBurialServicesByMemberId(memberId);
    
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
    console.error('Error fetching burial services by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch burial services'
    });
  }
});

/**
 * READ ONE - Get a single burial service by ID
 * GET /api/church-records/burial-services/getBurialServiceById/:id
 */
router.get('/getBurialServiceById/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Burial ID is required'
      });
    }

    const result = await getBurialServiceById(id);
    
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
    console.error('Error fetching burial service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch burial service'
    });
  }
});

/**
 * UPDATE - Update an existing burial service record
 * PUT /api/church-records/burial-services/updateBurialService/:id
 * Body: { member_id?, requestor?, relationship?, location?, pastor_id?, service_date?, status?, date_created? }
 */
router.put('/updateBurialService/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Burial ID is required'
      });
    }

    const result = await updateBurialService(id, req.body);
    
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
    console.error('Error updating burial service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update burial service'
    });
  }
});

/**
 * DELETE - Delete a burial service record
 * DELETE /api/church-records/burial-services/deleteBurialService/:id
 */
router.delete('/deleteBurialService/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Burial ID is required'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteBurialService(id, archivedBy);
    
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
    console.error('Error deleting burial service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete burial service'
    });
  }
});

/**
 * EXPORT - Export burial service records to Excel
 * GET /api/church-records/burial-services/exportExcel (query params)
 * POST /api/church-records/burial-services/exportExcel (body payload)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    const options = req.query;
    const excelBuffer = await exportBurialServicesToExcel(options);
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `burial_services_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting burial services to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export burial services to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    const options = req.body;
    const excelBuffer = await exportBurialServicesToExcel(options);
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `burial_services_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting burial services to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export burial services to Excel'
    });
  }
});

/**
 * FULLTEXT SEARCH - Advanced search using FULLTEXT indexes
 * GET /api/church-records/burial-services/searchFulltext
 * POST /api/church-records/burial-services/searchFulltext
 * Parameters: search (required), limit, offset, minRelevance
 */
router.get('/searchFulltext', async (req, res) => {
  try {
    const options = { ...req.query, useFulltext: true };
    const result = await searchBurialServicesFulltext(options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
        totalCount: result.totalCount,
        searchTerm: result.searchTerm,
        relevanceThreshold: result.relevanceThreshold
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error in FULLTEXT search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform FULLTEXT search'
    });
  }
});

router.post('/searchFulltext', async (req, res) => {
  try {
    const options = { ...req.body, useFulltext: true };
    const result = await searchBurialServicesFulltext(options);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
        totalCount: result.totalCount,
        searchTerm: result.searchTerm,
        relevanceThreshold: result.relevanceThreshold
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error in FULLTEXT search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform FULLTEXT search'
    });
  }
});

/**
 * ANALYZE AVAILABILITY - Analyze available dates and times for burial services
 * GET /api/church-records/burial-services/analyzeAvailability
 * POST /api/church-records/burial-services/analyzeAvailability
 * Parameters: startDate, endDate, location (optional), serviceDurationHours (optional), businessHours (optional)
 */
router.get('/analyzeAvailability', async (req, res) => {
  try {
    const options = req.query;
    const result = await analyzeBurialServiceAvailability(options);

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
    console.error('Error analyzing burial service availability:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze burial service availability'
    });
  }
});

router.post('/analyzeAvailability', async (req, res) => {
  try {
    const options = req.body;
    const result = await analyzeBurialServiceAvailability(options);

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
    console.error('Error analyzing burial service availability:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze burial service availability'
    });
  }
});

module.exports = router;

