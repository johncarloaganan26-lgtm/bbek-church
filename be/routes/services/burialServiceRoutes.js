const express = require('express');
const moment = require('moment');
const {
  createBurialService,
  getAllBurialServices,
  getBurialServiceById,
  getBurialServicesByMemberId,
  updateBurialService,
  deleteBurialService,
  bulkDeleteBurialServices,
  bulkCompleteBurialServices,
  exportBurialServicesToExcel,
  searchBurialServicesFulltext,
  analyzeBurialServiceAvailability,
  getAvailableBurialDates
} = require('../../dbHelpers/services/burialServiceRecords');
const { query } = require('../../database/db');
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
    const {
      search, limit, offset, page, pageSize, status, sortBy, dateRange
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
      search, limit, offset, page, pageSize, status, sortBy,
      dateRange: parsedDateRange
    };

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
    const {
      search, limit, offset, page, pageSize, status, sortBy, dateRange
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
      search, limit, offset, page, pageSize, status, sortBy,
      dateRange: parsedDateRange
    };

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

    // Check if user is admin
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'staff';
    const result = await updateBurialService(id, req.body, isAdmin);

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
 * Body: { reason?: string }
 */
router.delete('/deleteBurialService/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reason = req.body?.reason || null;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Burial ID is required'
      });
    }

    const archivedBy = req.user?.acc_id || null;
    const result = await deleteBurialService(id, archivedBy, reason);

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
 * BULK DELETE - Delete multiple burial service records
 * DELETE /api/church-records/burial-services/bulkDeleteBurialServices
 * Body: { burialIds: ["id1", "id2", "id3"], reason?: string }
 */
router.delete('/bulkDeleteBurialServices', async (req, res) => {
  try {
    const burialIds = req.body?.burialIds || [];
    const reason = req.body?.reason || null;
    const archivedBy = req.user?.acc_id || null;

    if (!Array.isArray(burialIds) || burialIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'burialIds array is required and cannot be empty'
      });
    }

    // Skip audit trail for bulk operations to improve performance
    req.skipAuditTrail = true;

    const result = await bulkDeleteBurialServices(burialIds, archivedBy, reason);

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
    console.error('Error bulk deleting burial services:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete burial services'
    });
  }
});

/**
 * BULK COMPLETE - Mark multiple burial service records as completed
 * PUT /api/church-records/burial-services/bulkCompleteBurialServices
 * Body: { burialIds: ["id1", "id2", "id3"] }
 */
router.put('/bulkCompleteBurialServices', async (req, res) => {
  try {
    const { burialIds } = req.body;

    if (!Array.isArray(burialIds) || burialIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'burialIds array is required and cannot be empty'
      });
    }

    // Fetch the global toggle setting
    const { getCmsPage } = require('../../dbHelpers/cmsRecords');
    const settingsResult = await getCmsPage('system_settings');
    const allowWithoutSchedule = settingsResult.success && settingsResult.data && settingsResult.data.content 
        ? settingsResult.data.content.allow_complete_without_schedule 
        : false;

    if (!allowWithoutSchedule) {
        // If restriction is ON, validate each request's status and date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredIds = [];
        const errors = [];

        for (const id of burialIds) {
            const [rows] = await query('SELECT status, service_date FROM tbl_burial_services WHERE burial_id = ?', [id]);
            if (rows.length === 0) {
                errors.push({ id, reason: 'Not found' });
                continue;
            }

            const burial = rows[0];
            if (burial.status !== 'approved') {
                errors.push({ id, reason: 'Status must be approved' });
                continue;
            }

            if (burial.service_date) {
                const scheduledDate = new Date(burial.service_date);
                scheduledDate.setHours(0, 0, 0, 0);
                if (scheduledDate > today) {
                    errors.push({ id, reason: 'Future service date' });
                    continue;
                }
            }
            filteredIds.push(id);
        }

        if (filteredIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No eligible records found for completion (must be approved and not in future)',
                errors
            });
        }

        const result = await bulkCompleteBurialServices(filteredIds);
        return res.json({ ...result, errors });
    }

    const result = await bulkCompleteBurialServices(burialIds);

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
    console.error('Error bulk completing burial services:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk complete burial services'
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

/**
 * GET AVAILABLE BURIAL DATES - Get available burial service dates with night shift
 * GET /api/church-records/burial-services/getAvailableBurialDates
 * Query params: daysAhead (optional, default: 30)
 * 
 * This endpoint is PUBLIC - anyone can view available dates
 * It analyzes all burial service records that are NOT approved/scheduled
 * and returns available daily dates between 5pm-10pm (night shift) for the next N days
 */
router.get('/getAvailableBurialDates', async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.daysAhead) || 30;
    
    const result = await getAvailableBurialDates(daysAhead);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting available burial dates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get available burial dates'
    });
  }
});

/**
 * AVAILABLE SLOTS - Get available burial service slots for admin
 * GET /api/services/burial-services/available-slots?days=14
 * Returns available dates (any day) with evening time slots only (6 PM - 10 PM)
 */
router.get('/available-slots', async (req, res) => {
  try {
    const timezone = 'Asia/Manila';
    const daysRaw = req.query.days;
    const requestedDays = Number.parseInt(String(daysRaw || '14'), 10);
    const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 1), 90) : 14;

    const momentTz = require('moment-timezone');
    const start = momentTz().tz(timezone).startOf('day');
    const endExclusive = start.clone().add(days, 'days');

    // Get all booked burial service slots within the date range
    const [bookedRows] = await query(`
      SELECT DATE_FORMAT(service_date, '%Y-%m-%d') AS booked_date, preferred_service_time as service_time
      FROM tbl_burialservice
      WHERE preferred_service_time IS NOT NULL
        AND service_date IS NOT NULL
        AND service_date >= ?
        AND service_date < ?
        AND status IN ('Approved', 'Scheduled')
      ORDER BY service_date ASC
    `, [
      start.format('YYYY-MM-DD HH:mm:ss'),
      endExclusive.format('YYYY-MM-DD HH:mm:ss')
    ]);

    const bookedMap = {};
    (bookedRows || []).forEach(row => {
      const dateKey = row.booked_date;
      if (!bookedMap[dateKey]) {
        bookedMap[dateKey] = [];
      }
      if (row.service_time) {
        bookedMap[dateKey].push(row.service_time);
      }
    });

    // Generate available dates with time slots (evening only: 6 PM - 10 PM, 30-min intervals)
    const dateGroups = [];
    for (let i = 0; i < days; i++) {
      const date = start.clone().add(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      const dayName = date.format('dddd');
      const bookedTimes = bookedMap[dateStr] || [];

      // Evening service times: 6:00 PM, 6:30 PM, 7:00 PM, 7:30 PM, 8:00 PM, 8:30 PM, 9:00 PM, 9:30 PM, 10:00 PM
      const defaultSlots = [
        '18:00:00', '18:30:00', '19:00:00', '19:30:00', 
        '20:00:00', '20:30:00', '21:00:00', '21:30:00', '22:00:00'
      ];
      
      const availableSlots = defaultSlots.filter(slot => !bookedTimes.includes(slot));

      if (availableSlots.length > 0) {
        dateGroups.push({
          date: dateStr,
          dayName: dayName,
          availableSlots: availableSlots.length,
          bookedSlots: bookedTimes.length,
          timeSlots: availableSlots.map(slot => {
            const [hours, minutes] = slot.split(':');
            const hour12 = parseInt(hours) % 12 || 12;
            const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
            return {
              time: slot,
              datetime: `${dateStr} ${slot}`,
              display: `${hour12}:${minutes} ${ampm}`
            };
          })
        });
      }
    }

    return res.json({
      success: true,
      data: dateGroups,
      meta: {
        timezone,
        days,
        startDate: start.format('YYYY-MM-DD'),
        endDate: endExclusive.format('YYYY-MM-DD')
      }
    });
  } catch (error) {
    console.error('Error fetching available burial slots:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch available slots'
    });
  }
});

module.exports = router;

