const express = require('express');
const moment = require('moment');
const multer = require('multer');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  bulkDeleteEvents,
  exportEventsToExcel,
  getEventsByMemberId,
  getSermonEvents,
  getCompletedSermonEvents
} = require('../../dbHelpers/church_records/eventRecords');

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * CREATE - Insert a new event record
 * POST /api/church-records/events/createEvent
 * Supports both:
 *   - JSON body with base64 image: { title, description, start_date, end_date, location, link?, type, status?, date_created?, image? }
 *   - multipart/form-data with file upload: form fields + 'image' file field
 */
router.post('/createEvent', upload.single('image'), async (req, res) => {
  try {
    // Prepare event data from request
    let eventData = { ...req.body };

    // If file was uploaded via multer, add it to eventData
    if (req.file) {
      eventData.image = req.file;
    }

    // If image is provided as base64 string in JSON body, it's already in eventData
    // The convertImageToBlob function will handle it

    const result = await createEvent(eventData);
    
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
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create event'
    });
  }
});

/**
 * READ ALL - Get all event records with pagination and filters
 * GET /api/church-records/events/getAllEvents (query params)
 * POST /api/church-records/events/getAllEvents (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, type, sortBy, dateRangeStart, dateRangeEnd
 */
router.get('/getAllEvents', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllEvents(options);
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
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch events'
    });
  }
});

router.post('/getAllEvents', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllEvents(options);
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
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch events'
    });
  }
});

/**
 * READ ONE - Get a single event by ID
 * GET /api/church-records/events/getEventById/:id
 */
router.get('/getEventById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID'
      });
    }

    const result = await getEventById(eventId);
    
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
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch event'
    });
  }
});

/**
 * UPDATE - Update an existing event record
 * PUT /api/church-records/events/updateEvent/:id
 * Supports both:
 *   - JSON body with base64 image: { title?, description?, start_date?, end_date?, location?, link?, type?, status?, date_created?, image? }
 *   - multipart/form-data with file upload: form fields + 'image' file field
 */
router.put('/updateEvent/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID'
      });
    }

    // Prepare event data from request
    let eventData = { ...req.body };

    // If file was uploaded via multer, add it to eventData
    if (req.file) {
      eventData.image = req.file;
    }

    // If image is provided as base64 string in JSON body, it's already in eventData
    // The convertImageToBlob function will handle it

    const result = await updateEvent(eventId, eventData);
    
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
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update event'
    });
  }
});

/**
 * DELETE - Delete an event record
 * DELETE /api/church-records/events/deleteEvent/:id
 */
router.delete('/deleteEvent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id);
    const archivedBy = req.user?.acc_id || null;

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID'
      });
    }

    const result = await deleteEvent(eventId, archivedBy);

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
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete event'
    });
  }
});

/**
 * BULK DELETE - Delete multiple event records
 * DELETE /api/church-records/events/bulkDeleteEvents
 * Body: { eventIds: [1, 2, 3] }
 */
router.delete('/bulkDeleteEvents', async (req, res) => {
  try {
    const { eventIds } = req.body;
    const archivedBy = req.user?.acc_id || null;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'eventIds array is required and cannot be empty'
      });
    }

    // Skip audit trail for bulk operations to improve performance
    req.skipAuditTrail = true;

    const result = await bulkDeleteEvents(eventIds, archivedBy);

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
    console.error('Error bulk deleting events:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete events'
    });
  }
});

/**
 * EXPORT - Export event records to Excel
 * GET /api/church-records/events/exportExcel (query params)
 * POST /api/church-records/events/exportExcel (body payload)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const excelBuffer = await exportEventsToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `events_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting events to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export events to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const excelBuffer = await exportEventsToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `events_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting events to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export events to Excel'
    });
  }
});

/**
 * READ ALL BY MEMBER - Get all events where a specific member has joined
 * GET /api/church-records/events/getEventsByMemberId/:memberId (query params)
 * POST /api/church-records/events/getEventsByMemberId/:memberId (body payload)
 * Parameters: search, limit, offset, page, pageSize, status, type, sortBy
 */
router.get('/getEventsByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const memberIdNum = parseInt(memberId);

    if (isNaN(memberIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid member ID'
      });
    }

    // Get parameters from query string
    const options = req.query;
    const result = await getEventsByMemberId(memberIdNum, options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
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
    console.error('Error fetching events by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch events by member ID'
    });
  }
});

router.post('/getEventsByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const memberIdNum = parseInt(memberId);

    if (isNaN(memberIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid member ID'
      });
    }

    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getEventsByMemberId(memberIdNum, options);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
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
    console.error('Error fetching events by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch events by member ID'
    });
  }
});

/**
 * READ ALL SERMON EVENTS - Get all sermon events that are not pending
 * GET /api/church-records/events/getSermonEvents
 * Returns sermon events prioritized by ongoing status, then sorted by latest date
 */
router.get('/getSermonEvents', async (req, res) => {
  try {
    const result = await getSermonEvents();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching sermon events:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sermon events'
    });
  }
});

/**
 * READ ALL COMPLETED SERMON EVENTS - Get all completed sermon events with links
 * GET /api/church-records/events/getCompletedSermonEvents
 * Returns completed sermon events (status = 'completed') that have links, sorted by latest date
 */
router.get('/getCompletedSermonEvents', async (req, res) => {
  try {
    const result = await getCompletedSermonEvents();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching completed sermon events:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch completed sermon events'
    });
  }
});

module.exports = router;

