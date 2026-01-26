const express = require('express');
const moment = require('moment');
const {
  createChildDedication,
  getAllChildDedications,
  getChildDedicationById,
  getChildDedicationsByRequester,
  updateChildDedication,
  deleteChildDedication,
  bulkDeleteChildDedications,
  exportChildDedicationsToExcel,
  checkDuplicateChildDedication,
  checkTimeSlotAvailability
} = require('../../dbHelpers/services/childDedicationRecords');
const dateFormattingMiddleware = require('../../middleware/dateFormattingMiddleware');

const router = express.Router();

// Apply date formatting middleware to all child dedication routes
router.use(dateFormattingMiddleware);

/**
 * CHECK DUPLICATE - Check if child dedication already exists
 * GET /api/church-records/child-dedications/check-duplicate
 * Query params: requested_by, child_firstname, child_lastname, date_of_birth, exclude_child_id (optional)
 */
router.get('/check-duplicate', async (req, res) => {
  try {
    const { requested_by, child_firstname, child_lastname, date_of_birth, exclude_child_id } = req.query;
    
    if (!requested_by || !child_firstname || !child_lastname || !date_of_birth) {
      return res.status(400).json({
        success: false,
        message: 'requested_by, child_firstname, child_lastname, and date_of_birth are required'
      });
    }
    
    const result = await checkDuplicateChildDedication(
      requested_by,
      child_firstname,
      child_lastname,
      date_of_birth,
      exclude_child_id || null
    );
    
    if (result.isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'A child dedication request for this child already exists from this member',
        data: { exists: true, dedication: result.dedication }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'No duplicate found',
      data: { exists: false }
    });
  } catch (error) {
    console.error('Error checking duplicate child dedication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check duplicate'
    });
  }
});

/**
 * CHECK TIME SLOT - Check if a time slot is available for child dedication
 * GET /api/church-records/child-dedications/check-time-slot
 * Query params: preferred_dedication_date, preferred_dedication_time, exclude_id (optional)
 */
router.get('/check-time-slot', async (req, res) => {
  try {
    const { preferred_dedication_date, preferred_dedication_time, exclude_id } = req.query;

    if (!preferred_dedication_date || !preferred_dedication_time) {
      return res.status(400).json({
        success: false,
        message: 'preferred_dedication_date and preferred_dedication_time are required'
      });
    }

    const result = await checkTimeSlotAvailability(
      preferred_dedication_date,
      preferred_dedication_time,
      exclude_id || null
    );

    if (result.isBooked) {
      return res.status(200).json({
        success: true,
        message: 'Time slot is booked',
        data: {
          isBooked: true,
          conflictingDedication: result.conflictingDedication
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Time slot is available',
      data: { isBooked: false }
    });
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check time slot availability'
    });
  }
});

/**
 * CHECK MEMBER HAS DEDICATION - Check if member already has a child dedication request
 * GET /api/church-records/child-dedications/check-member-dedication/:memberId
 */
router.get('/check-member-dedication/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }
    
    const result = await getChildDedicationsByRequester(memberId);
    
    if (result.success && result.data && result.data.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Member already has child dedication requests',
        data: { hasDedication: true, dedications: result.data }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Member has no existing child dedication requests',
      data: { hasDedication: false }
    });
  } catch (error) {
    console.error('Error checking member dedication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check member dedication'
    });
  }
});

/**
 * CREATE - Insert a new child dedication record
 * POST /api/church-records/child-dedications/createChildDedication
 * Body: { requested_by, child_firstname, child_lastname, child_middle_name?, date_of_birth, place_of_birth, gender, preferred_dedication_date, contact_phone_number, contact_email?, contact_address, status?, date_created? }
 */
router.post('/createChildDedication', async (req, res) => {
  try {
    const result = await createChildDedication(req.body);
    
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
    console.error('Error creating child dedication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create child dedication'
    });
  }
});

/**
 * READ ALL - Get all child dedication records with pagination and filters
 * GET /api/church-records/child-dedications/getAllChildDedications (query params)
 * POST /api/church-records/child-dedications/getAllChildDedications (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, sortBy
 */
router.get('/getAllChildDedications', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllChildDedications(options);
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
    console.error('Error fetching child dedications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch child dedications'
    });
  }
});

router.post('/getAllChildDedications', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllChildDedications(options);
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
    console.error('Error fetching child dedications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch child dedications'
    });
  }
});

/**
 * READ ONE - Get a single child dedication by ID
 * GET /api/church-records/child-dedications/getChildDedicationById/:id
 */
router.get('/getChildDedicationById/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const result = await getChildDedicationById(id);
    
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
    console.error('Error fetching child dedication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch child dedication'
    });
  }
});

/**
 * READ - Get child dedication requests by requester member_id
 * GET /api/church-records/child-dedications/getChildDedicationsByRequester/:memberId
 */
router.get('/getChildDedicationsByRequester/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'Member ID is required'
      });
    }

    const result = await getChildDedicationsByRequester(memberId);
    
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
    console.error('Error fetching child dedications by requester:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch child dedications'
    });
  }
});

/**
 * UPDATE - Update an existing child dedication record
 * PUT /api/church-records/child-dedications/updateChildDedication/:id
 * Body: { requested_by?, child_firstname?, child_lastname?, child_middle_name?, date_of_birth?, place_of_birth?, gender?, preferred_dedication_date?, contact_phone_number?, contact_email?, contact_address?, status?, date_created? }
 */
router.put('/updateChildDedication/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    // Check if user is admin
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'staff';
    const result = await updateChildDedication(id, req.body, isAdmin);
    
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
    console.error('Error updating child dedication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update child dedication'
    });
  }
});

/**
 * DELETE - Delete a child dedication record
 * DELETE /api/church-records/child-dedications/deleteChildDedication/:id
 */
router.delete('/deleteChildDedication/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Child ID is required'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteChildDedication(id, archivedBy);
    
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
    console.error('Error deleting child dedication:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete child dedication'
    });
  }
});

/**
 * BULK DELETE - Delete multiple child dedication records
 * DELETE /api/church-records/child-dedications/bulkDeleteChildDedications
 * Body: { childIds: ["id1", "id2", "id3"] }
 */
router.delete('/bulkDeleteChildDedications', async (req, res) => {
  try {
    const { childIds } = req.body;
    const archivedBy = req.user?.acc_id || null;

    if (!Array.isArray(childIds) || childIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'childIds array is required and cannot be empty'
      });
    }

    // Skip audit trail for bulk operations to improve performance
    req.skipAuditTrail = true;

    const result = await bulkDeleteChildDedications(childIds, archivedBy);

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
    console.error('Error bulk deleting child dedications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete child dedications'
    });
  }
});

/**
 * EXPORT - Export child dedication records to Excel
 * GET /api/church-records/child-dedications/exportExcel (query params)
 * POST /api/church-records/child-dedications/exportExcel (body payload)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    const options = req.query;
    const excelBuffer = await exportChildDedicationsToExcel(options);
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `child_dedications_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting child dedications to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export child dedications to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    const options = req.body;
    const excelBuffer = await exportChildDedicationsToExcel(options);
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `child_dedications_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting child dedications to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export child dedications to Excel'
    });
  }
});

module.exports = router;

