const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const {
    createDiscipleshipRequest,
    getAllDiscipleshipRequests,
    updateDiscipleshipRequest,
    promoteToBaptism,
    inviteToBaptism,
    deleteDiscipleshipRequest,
    archiveDiscipleshipRequest,
    exportDiscipleshipRequestsToExcel
} = require('../../dbHelpers/services/discipleshipRecords');
const { authenticateToken, checkAdminRole } = require('../../middleware/authMiddleware');
const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
const archiveRecord = require('../../dbHelpers/archiveRecords').archiveRecord;
const { query } = require('../../database/db');
const emailHelper = require('../../dbHelpers/emailHelper');
const { generateCandidateSlotsForDate, validateSelectedSlot, BIBLE_STUDY_CAPACITY } = require('../../utils/scheduling');

// Keep date validation consistent with stored scheduling values.
moment.tz.setDefault('Asia/Manila');

// =============================================================================
// ERROR TRAPPING CONSTANTS
// =============================================================================

// Valid status transitions: Current Status → [Allowed Next Statuses]
const VALID_STATUS_TRANSITIONS = {
    'Pending': ['Scheduled', 'Completed', 'Cancelled', 'Rejected'],
    'Scheduled': ['Completed', 'Cancelled', 'Rejected'],
    'Completed': ['Promoted'], // Can only be promoted, not cancelled
    'Promoted': [], // Terminal state - no transitions allowed
    'Cancelled': [], // Terminal state - no transitions allowed
    'Rejected': [] // Terminal state - no transitions allowed
};

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * GET available schedule slots (Automatic)
 *
 * Query params:
 * - date: YYYY-MM-DD (defaults to today in Asia/Manila)
 * - service: salvation | bible_study (defaults to salvation)
 */
async function handleAvailableSlotsRequest(req, res, serviceOverride = null) {
    try {
        const timezone = 'Asia/Manila';
        const dateStr = req.query.date;
        const serviceParam = serviceOverride || req.query.service || req.query.type || 'salvation';

        // If date is supplied, return slots for that specific date.
        if (dateStr) {
            const generated = generateCandidateSlotsForDate({ serviceType: serviceParam, dateStr, timezone });
            if (!generated.success) {
                return res.status(400).json({ success: false, message: generated.message });
            }

            const serviceType = generated.meta.serviceType;

            // Get booked slots for that date + service.
            let bookedSql = '';
            let bookedParams = [generated.meta.date];

            if (serviceType === 'salvation') {
                bookedSql = `
                  SELECT DATE_FORMAT(
                    IF(
                      scheduled_time IS NOT NULL AND TIME(scheduled_date) = '00:00:00',
                      TIMESTAMP(DATE(scheduled_date), scheduled_time),
                      scheduled_date
                    ),
                    '%Y-%m-%d %H:%i:%s'
                  ) AS slot_datetime
                  FROM tbl_discipleship_requests
                  WHERE request_type = 'Salvation'
                    AND status IN ('Pending', 'Scheduled', 'Rejected')
                    AND scheduled_date IS NOT NULL
                    AND DATE(scheduled_date) = ?
                `;
            } else if (serviceType === 'bible_study') {
                bookedSql = `
                  SELECT DATE_FORMAT(scheduled_date, '%Y-%m-%d %H:%i:%s') AS slot_datetime
                  FROM tbl_biblestudy_requests
                  WHERE status IN ('Pending', 'Scheduled', 'Rejected')
                    AND scheduled_date IS NOT NULL
                    AND DATE(scheduled_date) = ?
                `;
            } else if (serviceType === 'water_baptism') {
                bookedSql = `
                  SELECT DATE_FORMAT(baptism_date, '%Y-%m-%d %H:%i:%s') AS slot_datetime
                  FROM tbl_waterbaptism
                  WHERE status IN ('pending', 'approved', 'scheduled')
                    AND baptism_date IS NOT NULL
                    AND DATE(baptism_date) = ?
                `;
            }

            const [bookedRows] = await query(bookedSql, bookedParams);
            
            // Map booked slots to counts
            const bookedCounts = (bookedRows || []).reduce((acc, r) => {
                const dt = r.slot_datetime;
                if (dt) acc[dt] = (acc[dt] || 0) + 1;
                return acc;
            }, {});

            const processedSlots = (generated.data || []).map(slot => ({
                ...slot,
                bookedCount: bookedCounts[slot.datetime] || 0
            }));

            // For Salvation Talk, allow all generated slots and include booked count.
            // For Bible Study, show as available unless capacity reached.
            const available = serviceType === 'salvation' 
                ? processedSlots 
                : processedSlots.filter(s => s.bookedCount < BIBLE_STUDY_CAPACITY);

            return res.json({
                success: true,
                data: available,
                meta: generated.meta
            });
        }

        // Grouped dates UI: Today onwards.
        const daysRaw = req.query.days;
        const requestedDays = Number.parseInt(String(daysRaw || '7'), 10);
        const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 1), 90) : 7;

        // Start from TODAY to allow manually added slots for today to reflect.
        const start = moment().tz(timezone).startOf('day');
        const endExclusive = start.clone().add(requestedDays, 'days');

        // Determine normalized service type (via generator's meta, reusing its validator).
        const normalizedProbe = generateCandidateSlotsForDate({
            serviceType: serviceParam,
            dateStr: start.format('YYYY-MM-DD'),
            timezone
        });
        if (!normalizedProbe.success) {
            return res.status(400).json({ success: false, message: normalizedProbe.message });
        }
        const serviceType = normalizedProbe.meta.serviceType;

        // Fetch all booked slots within range in one query.
        let bookedRangeSql = '';
        let bookedRangeParams = [
            start.format('YYYY-MM-DD HH:mm:ss'),
            endExclusive.format('YYYY-MM-DD HH:mm:ss')
        ];

        if (serviceType === 'salvation') {
            bookedRangeSql = `
              SELECT DATE_FORMAT(
                IF(
                  scheduled_time IS NOT NULL AND TIME(scheduled_date) = '00:00:00',
                  TIMESTAMP(DATE(scheduled_date), scheduled_time),
                  scheduled_date
                ),
                '%Y-%m-%d %H:%i:%s'
              ) AS slot_datetime
              FROM tbl_discipleship_requests
              WHERE request_type = 'Salvation'
                AND status IN ('Pending', 'Scheduled', 'Rejected')
                AND scheduled_date IS NOT NULL
                AND scheduled_date >= ?
                AND scheduled_date < ?
            `;
        } else if (serviceType === 'bible_study') {
            bookedRangeSql = `
              SELECT DATE_FORMAT(scheduled_date, '%Y-%m-%d %H:%i:%s') AS slot_datetime
              FROM tbl_biblestudy_requests
              WHERE status IN ('Pending', 'Scheduled', 'Rejected')
                AND scheduled_date IS NOT NULL
                AND scheduled_date >= ?
                AND scheduled_date < ?
            `;
        } else if (serviceType === 'water_baptism') {
            bookedRangeSql = `
              SELECT DATE_FORMAT(baptism_date, '%Y-%m-%d %H:%i:%s') AS slot_datetime
              FROM tbl_waterbaptism
              WHERE status IN ('pending', 'approved', 'scheduled')
                AND baptism_date IS NOT NULL
                AND baptism_date >= ?
                AND baptism_date < ?
            `;
        }

        const [bookedRows] = await query(bookedRangeSql, bookedRangeParams);
        
        // Map booked slots to counts
        const bookedCounts = (bookedRows || []).reduce((acc, r) => {
            const dt = r.slot_datetime;
            if (dt) acc[dt] = (acc[dt] || 0) + 1;
            return acc;
        }, {});

        let manualSlotsSql = '';
        let manualSlotsParams = [];

        if (serviceType === 'salvation' || serviceType === 'bible_study' || serviceType === 'water_baptism') {
            manualSlotsSql = `
                SELECT DATE_FORMAT(available_date, '%Y-%m-%d') as date, 
                       DATE_FORMAT(available_time, '%H:%i') as time,
                       CONCAT(DATE_FORMAT(available_date, '%Y-%m-%d'), ' ', DATE_FORMAT(available_time, '%H:%i:00')) as datetime,
                       max_slots, status
                FROM tbl_service_slots
                WHERE service_type = ? 
                AND available_date >= ? AND available_date < ?
                AND status = 'Available'
            `;
            manualSlotsParams = [serviceType, start.format('YYYY-MM-DD'), endExclusive.format('YYYY-MM-DD')];
        }

        const [manualRows] = manualSlotsSql ? await query(manualSlotsSql, manualSlotsParams) : [[]];
        console.log(`[SlotsDebug] Service: ${serviceType}, Range: ${start.format('YYYY-MM-DD')} to ${endExclusive.format('YYYY-MM-DD')}`);
        console.log(`[SlotsDebug] Manual rows found: ${manualRows.length}`);

        const dateGroups = [];
        for (let i = 0; i < days; i++) {
            const dateStr = start.clone().add(i, 'days').format('YYYY-MM-DD');
            const manualForDate = manualRows.filter(r => r.date === dateStr);
            
            let combinedSlots = [];
            
            // 1. Get generated slots for this date
            const generated = generateCandidateSlotsForDate({ serviceType, dateStr: dateStr, timezone });
            if (generated.success) {
                const defaultCapacity = serviceType === 'bible_study' ? BIBLE_STUDY_CAPACITY : 1;
                combinedSlots = (generated.data || []).map(s => ({
                    ...s,
                    display: moment(s.datetime).format('h:mm A'),
                    bookedCount: bookedCounts[s.datetime] || 0,
                    maxCapacity: defaultCapacity,
                    isManual: false
                }));
            }
            
            // 2. Merge manual slots
            for (const manual of manualForDate) {
                const manualSlot = {
                    datetime: manual.datetime,
                    time: manual.time,
                    display: moment(manual.datetime).format('h:mm A'),
                    bookedCount: bookedCounts[manual.datetime] || 0,
                    maxCapacity: manual.max_slots,
                    isManual: true
                };
                
                const existingIndex = combinedSlots.findIndex(s => s.datetime === manual.datetime);
                if (existingIndex !== -1) {
                    combinedSlots[existingIndex] = manualSlot;
                } else {
                    combinedSlots.push(manualSlot);
                }
            }

            const available = combinedSlots
                .filter(s => s.bookedCount < s.maxCapacity)
                .sort((a, b) => a.datetime.localeCompare(b.datetime));

            if (available.length > 0) {
                dateGroups.push({
                    date: dateStr,
                    availableSlots: available.length,
                    timeSlots: available
                });
            }
        }

        return res.json({
            success: true,
            data: dateGroups,
            meta: {
                timezone,
                serviceType,
                days,
                startDate: start.format('YYYY-MM-DD')
            }
        });
    } catch (error) {
        console.error('Error in handleAvailableSlotsRequest:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

router.get('/available-slots', async (req, res) => {
    return handleAvailableSlotsRequest(req, res);
});

router.get('/salvation-availability', async (req, res) => {
    return handleAvailableSlotsRequest(req, res, 'salvation');
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate status transition
 * @param {string} currentStatus - Current status of the request
 * @param {string} newStatus - Proposed new status
 * @returns {object} - { valid: boolean, message: string }
 */
function validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (allowedTransitions.length === 0) {
        return {
            valid: false,
            message: `Cannot change status from '${currentStatus}'. This is a terminal state.`
        };
    }

    if (!allowedTransitions.includes(newStatus)) {
        return {
            valid: false,
            message: `Cannot transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${allowedTransitions.join(', ') || 'None'}`
        };
    }

    return { valid: true };
}

/**
 * Validate scheduling date
 * @param {string} scheduledDate - Proposed scheduled date
 * @returns {object} - { valid: boolean, message: string }
 */
function validateScheduledDate(scheduledDate, requestType = 'Salvation') {
    if (!scheduledDate) {
        return { valid: true }; // No date to validate
    }

    const normalizedType = String(requestType || '').trim().toLowerCase();
    const serviceType = normalizedType === 'bible study' ? 'bible_study' : 'salvation';

    const validation = validateSelectedSlot({
        serviceType,
        scheduledDateTimeStr: scheduledDate,
        timezone: 'Asia/Manila'
    });

    if (!validation.valid) {
        return { valid: false, message: validation.message };
    }

    return { valid: true };
}

/**
 * Check for scheduling conflicts
 * @param {string} pastorId - Pastor ID
 * @param {string} scheduledDate - Proposed scheduled date
 * @param {string} excludeRequestId - Request ID to exclude from check
 * @returns {object} - { valid: boolean, message: string }
 */
async function checkSchedulingConflict(pastorId, scheduledDate, excludeRequestId = null) {
    if (!pastorId || !scheduledDate) {
        return { valid: true };
    }

    let sql = `
        SELECT request_id, firstname, lastname, scheduled_date, pastor_id 
        FROM tbl_discipleship_requests 
        WHERE pastor_id = ? 
        AND scheduled_date = ? 
        AND status NOT IN ('Promoted', 'Cancelled')
    `;
    const params = [pastorId, scheduledDate];

    if (excludeRequestId) {
        sql += ' AND request_id != ?';
        params.push(excludeRequestId);
    }

    const [rows] = await query(sql, params);

    if (rows.length > 0) {
        const conflictPerson = `${rows[0].firstname} ${rows[0].lastname}`;
        return {
            valid: false,
            message: `Pastor already has a session scheduled with ${conflictPerson} on this date. Please select a different date or time.`
        };
    }

    return { valid: true };
}

/**
 * Validate required fields based on action type
 * @param {string} action - Action type (schedule, update_status, promote, etc.)
 * @param {object} data - Request data
 * @returns {object} - { valid: boolean, message: string }
 */
function validateRequiredFields(action, data) {
    const errors = [];

    switch (action) {
        case 'schedule':
            if (!data.pastor_id || data.pastor_id === '') {
                errors.push('Pastor must be assigned before scheduling');
            }
            if (!data.scheduled_date) {
                errors.push('Scheduled date is required');
            }
            if (!data.location) {
                errors.push('Location is required');
            }
            break;

        case 'update_status':
            if (!data.status) {
                errors.push('Status is required');
            }
            break;

        case 'promote':
            if (data.status && data.status !== 'Completed') {
                errors.push('Can only promote requests with "Completed" status');
            }
            break;

        case 'update':
            if (data.pastor_id === '' && data.scheduled_date) {
                errors.push('Cannot schedule without assigning a pastor');
            }
            if (data.scheduled_date && !data.pastor_id) {
                errors.push('Cannot schedule without assigning a pastor');
            }
            break;
    }

    if (errors.length > 0) {
        return { valid: false, message: errors.join('; ') };
    }

    return { valid: true };
}

/**
 * Check for duplicates
 * @param {string} email - Email to check
 * @param {string} excludeRequestId - Request ID to exclude from check
 * @returns {object} - { valid: boolean, message: string }
 */
async function checkDuplicates(email, excludeRequestId = null) {
    let sql = 'SELECT request_id, status, request_type FROM tbl_discipleship_requests WHERE email = ?';
    const params = [email.toLowerCase().trim()];

    if (excludeRequestId) {
        sql += ' AND request_id != ?';
        params.push(excludeRequestId);
    }

    const [rows] = await query(sql, params);

    if (rows.length > 0) {
        const status = rows[0].status;
        const requestId = rows[0].request_id;
        const requestType = rows[0].request_type;

        if (['Pending', 'Scheduled'].includes(status)) {
            return {
                valid: false,
                message: `A discipleship request with this email already exists (${requestId}) with status "${status}". Please check the existing request instead of creating a duplicate.`
            };
        } else if (status === 'Completed') {
            if (requestType === 'Salvation') {
                return {
                    valid: false,
                    message: `This person has already completed the Salvation Talk stage (${requestId}). Please proceed to schedule Bible Study (Wednesdays/Saturdays) for this existing request.`
                };
            }
            return {
                valid: false,
                message: `This person has already completed discipleship (${requestId}). They should be promoted to water baptism.`
            };
        } else if (status === 'Promoted') {
            return {
                valid: false,
                message: `This person has already been promoted to water baptism (${requestId}).`
            };
        }
    }

    return { valid: true };
}

// =============================================================================
// EMAIL HELPER FUNCTIONS
// =============================================================================

/**
 * Send status notification email
 * @param {object} data - Email data
 */
async function sendStatusNotificationEmail({ email, firstname, lastname, request_type, status, scheduled_date, pastor_name, location }) {
    try {
        await emailHelper.sendDiscipleshipDetails({
            email,
            status: status.toLowerCase(),
            recipientName: `${firstname} ${lastname}`,
            firstname,
            lastname,
            request_type,
            scheduled_date,
            pastor_id: pastor_name,
            location
        });
        console.log(`Status notification email sent to ${email} for status: ${status}`);
    } catch (emailError) {
        console.error('Failed to send status notification email:', emailError);
    }
}

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

// PUBLIC: Submit Interest
router.post('/submit', async (req, res) => {
    try {
        const { email, firstname, lastname } = req.body;

        // Public landing page is Salvation-only per spec.
        req.body.request_type = 'Salvation';

        // Check for duplicates before creating
        const duplicateCheck = await checkDuplicates(email);
        if (!duplicateCheck.valid) {
            return res.status(400).json({
                success: false,
                message: duplicateCheck.message,
                errorCode: 'DUPLICATE_REQUEST'
            });
        }

        // Attach group_id if there are companions
        const hasCompanions = req.body.companions && Array.isArray(req.body.companions) && req.body.companions.length > 0;
        const groupId = hasCompanions ? `GRP-${Date.now()}` : null;
        
        if (groupId) {
            let notesObj = { group_id: groupId };
            if (req.body.notes) {
                try { 
                    notesObj = { ...JSON.parse(req.body.notes), ...notesObj };
                } catch (e) { 
                    notesObj.original_notes = req.body.notes; 
                }
            }
            req.body.notes = JSON.stringify(notesObj);
        }

        const result = await createDiscipleshipRequest(req.body);

        // Process companions if any
        if (hasCompanions) {
            for (const comp of req.body.companions) {
                try {
                    // Check duplicate for companion
                    const compDuplicateCheck = await checkDuplicates(comp.email);
                    if (compDuplicateCheck.valid) {
                        await createDiscipleshipRequest({
                            ...req.body,
                            firstname: comp.firstname,
                            lastname: comp.lastname,
                            email: comp.email,
                            birthdate: comp.birthdate,
                            age: comp.age,
                            companions: [], // Prevent infinite recursion if passed somehow
                            notes: JSON.stringify({ group_id: groupId })
                        });
                    }
                } catch (compError) {
                    console.error('Error creating companion request:', compError);
                    // Continue with other companions even if one fails
                }
            }
        }

        // Log successful submission
        await auditTrailRecords.createAuditLog({
            action_type: 'DISCIPLESHIP_SUBMITTED',
            module: 'Discipleship',
            description: JSON.stringify({ 
                request_id: result.data?.request_id, 
                firstname, 
                lastname, 
                email,
                companions_count: req.body.companions ? req.body.companions.length : 0 
            }),
            user_id: null,
            user_email: null,
            user_name: 'Public User',
            user_position: 'public'
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Submit error:', error);
        res.status(400).json({
            success: false,
            message: error.message,
            errorCode: 'SUBMIT_ERROR'
        });
    }
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// ADMIN: Get All Requests
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page, pageSize, search, status, request_type, sortBy, startDate, endDate } = req.query;
        // For exports, we might not want pagination. Let's pass that flag.
        const result = await getAllDiscipleshipRequests({ 
            page, 
            pageSize, 
            search, 
            status, 
            request_type, 
            sortBy,
            startDate,
            endDate,
            noPagination: req.query.noPagination === 'true'
        });
        res.json(result);
    } catch (error) {
        console.error('Get All error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: 'FETCH_ERROR'
        });
    }
});

// ADMIN: Export Discipleship Requests to Excel
router.get('/exportExcel', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const format = req.query.format || 'xlsx';
        const buffer = await exportDiscipleshipRequestsToExcel(req.query);
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const filename = `salvation_export_${timestamp}.${format}`;
        
        const contentType = format === 'csv' 
            ? 'text/csv' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/exportExcel', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const format = req.body.format || 'xlsx';
        const buffer = await exportDiscipleshipRequestsToExcel(req.body);
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const filename = `salvation_export_${timestamp}.${format}`;
        
        const contentType = format === 'csv' 
            ? 'text/csv' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Get Request Details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Get details error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: 'FETCH_ERROR'
        });
    }
});

// PUBLIC: Get Registration Data by Reference ID (for form pre-fill)
router.get('/registration-data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let userData = null;

        if (id.startsWith('REQ')) {
            // Fetch from Discipleship/Salvation table
            const [rows] = await query(
                `SELECT request_id, firstname, lastname, middle_name, email, phone_number, address, birthdate, age, gender, civil_status, profession, 
                        spouse_name, marriage_date, children, guardian_name, guardian_contact, guardian_relationship
                 FROM tbl_discipleship_requests 
                 WHERE request_id = ? LIMIT 1`,
                [id]
            );
            if (rows.length > 0) {
                userData = rows[0];
            }
        } else if (id.startsWith('BSR')) {
            // Fetch from Bible Study table, joined with original Salvation record
            const [rows] = await query(
                `SELECT b.request_id, b.firstname, b.lastname, b.email, b.phone_number, b.location, b.notes,
                        COALESCE(b.middle_name, s.middle_name) as middle_name,
                        COALESCE(b.birthdate, s.birthdate) as birthdate,
                        COALESCE(b.age, s.age) as age,
                        COALESCE(b.gender, s.gender) as gender,
                        COALESCE(b.civil_status, s.civil_status) as civil_status,
                        COALESCE(b.profession, s.profession) as profession,
                        COALESCE(b.spouse_name, s.spouse_name) as spouse_name,
                        COALESCE(b.marriage_date, s.marriage_date) as marriage_date,
                        COALESCE(b.children, s.children) as children,
                        COALESCE(b.guardian_name, s.guardian_name) as guardian_name,
                        COALESCE(b.guardian_contact, s.guardian_contact) as guardian_contact,
                        COALESCE(b.guardian_relationship, s.guardian_relationship) as guardian_relationship,
                        COALESCE(b.address, s.address) as salvation_address
                 FROM tbl_biblestudy_requests b
                 LEFT JOIN tbl_discipleship_requests s ON (
                    (b.salvation_id IS NOT NULL AND b.salvation_id = s.request_id) OR
                    (b.salvation_id IS NULL AND b.email = s.email)
                 )
                 WHERE b.request_id = ? 
                 ORDER BY s.date_created DESC
                 LIMIT 1`,
                [id]
            );
            if (rows.length > 0) {
                const row = rows[0];
                let address = row.salvation_address || row.location || '';
                
                // If address is still empty, check if it's stored in notes as JSON
                if ((!address || address === '') && row.notes && row.notes.trim().startsWith('{')) {
                    try {
                        const notesData = JSON.parse(row.notes);
                        if (notesData.address) address = notesData.address;
                    } catch (e) {}
                }
                
                userData = {
                    ...row,
                    address: address
                };
            }
        }

        if (!userData) {
            return res.status(404).json({
                success: false,
                message: 'Registration data not found',
                errorCode: 'NOT_FOUND'
            });
        }

        res.json({ 
            success: true, 
            data: {
                request_id: userData.request_id,
                firstname: userData.firstname || '',
                lastname: userData.lastname || '',
                middle_name: userData.middle_name || '',
                email: userData.email || '',
                phone_number: userData.phone_number || '',
                address: userData.address || '',
                birthdate: userData.birthdate || null,
                age: userData.age || null,
                gender: userData.gender || '',
                civil_status: userData.civil_status || '',
                profession: userData.profession || '',
                spouse_name: userData.spouse_name || '',
                marriage_date: userData.marriage_date || null,
                children: userData.children || '',
                guardian_name: userData.guardian_name || '',
                guardian_contact: userData.guardian_contact || '',
                guardian_relationship: userData.guardian_relationship || ''
            }
        });
    } catch (error) {
        console.error('Get registration data error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: 'FETCH_ERROR'
        });
    }
});

// ADMIN: Update Request (Schedule/Status)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Allow server-side normalization without mutating req.body.
        const updatePayload = { ...req.body };
        const { firstname, lastname, email, request_type } = updatePayload;

        // Get current record for validations/fallbacks
        const [currentRows] = await query(
            'SELECT status, scheduled_date, pastor_id, location, request_type FROM tbl_discipleship_requests WHERE request_id = ?',
            [id]
        );
        if (currentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }

        const currentStatus = currentRows[0].status;
        const currentPastorId = currentRows[0].pastor_id;
        const currentLocation = currentRows[0].location;
        const currentScheduledDate = currentRows[0].scheduled_date;
        const currentRequestType = currentRows[0].request_type;

        const effectiveRequestType = request_type || currentRequestType;

        const isStartingBibleStudy =
            request_type &&
            request_type !== currentRequestType &&
            request_type === 'Bible Study';

        // Flow rule: Bible Study should only happen after Salvation Talk is completed.
        if (isStartingBibleStudy) {
            if (currentStatus !== 'Completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Please mark the Salvation Talk as "Completed" before starting Bible Study scheduling.',
                    errorCode: 'INVALID_REQUEST_TYPE_FLOW'
                });
            }

            // Default the next stage status if not explicitly provided.
            if (!updatePayload.status) {
                updatePayload.status = updatePayload.scheduled_date ? 'Scheduled' : 'Pending';
            }

            // Avoid accidentally carrying over the Salvation schedule into the Bible Study stage.
            if (updatePayload.status === 'Pending') {
                updatePayload.scheduled_date = null;
            }

            if (updatePayload.status === 'Scheduled') {
                const incoming = updatePayload.scheduled_date
                    ? moment.tz(updatePayload.scheduled_date, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], 'Asia/Manila')
                    : null;
                const current = currentScheduledDate ? moment.tz(currentScheduledDate, 'Asia/Manila') : null;
                const isSameSchedule = incoming && current && incoming.isValid() && current.isValid() && incoming.isSame(current);

                // Require a new schedule when switching to Bible Study to prevent keeping the old Salvation schedule.
                if (!incoming || !incoming.isValid() || isSameSchedule) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please select a new Bible Study schedule date and time.',
                        errorCode: 'MISSING_BIBLE_STUDY_SCHEDULE'
                    });
                }
            }

            // Allow stage restart statuses only.
            if (!['Pending', 'Scheduled', 'Cancelled'].includes(updatePayload.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status for Bible Study stage start. Valid statuses: Pending, Scheduled, Cancelled.',
                    errorCode: 'INVALID_STATUS_FOR_STAGE_START'
                });
            }
        }

        // Validate status transition if status is being changed
        if (updatePayload.status && updatePayload.status !== currentStatus) {
            // When starting Bible Study, we intentionally allow resetting status from Completed -> Pending/Scheduled.
            if (!isStartingBibleStudy) {
                const statusValidation = validateStatusTransition(currentStatus, updatePayload.status);
                if (!statusValidation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: statusValidation.message,
                        errorCode: 'INVALID_STATUS_TRANSITION'
                    });
                }
            }
        }

        // Validate scheduled date if being changed
        if (updatePayload.scheduled_date && updatePayload.scheduled_date !== currentScheduledDate) {
            const dateValidation = validateScheduledDate(updatePayload.scheduled_date, effectiveRequestType);
            if (!dateValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: dateValidation.message,
                    errorCode: 'INVALID_SCHEDULE_DATE'
                });
            }

            // Check for scheduling conflicts
            const pastorIdForCheck = updatePayload.pastor_id || currentPastorId;
            if (pastorIdForCheck) {
                const conflictCheck = await checkSchedulingConflict(pastorIdForCheck, updatePayload.scheduled_date, id);
                if (!conflictCheck.valid) {
                    return res.status(400).json({
                        success: false,
                        message: conflictCheck.message,
                        errorCode: 'SCHEDULING_CONFLICT'
                    });
                }
            }
        }

        // Validate required fields only when scheduling is intended.
        const scheduledDateForValidation =
            updatePayload.scheduled_date !== undefined ? updatePayload.scheduled_date : currentScheduledDate;
        const pastorIdForValidation =
            updatePayload.pastor_id !== undefined ? updatePayload.pastor_id : currentPastorId;
        const locationForValidation =
            updatePayload.location !== undefined ? updatePayload.location : currentLocation;

        const isSchedulingAction =
            updatePayload.status === 'Scheduled' ||
            (updatePayload.scheduled_date !== undefined && !!updatePayload.scheduled_date);

        if (isSchedulingAction) {
            const requiredValidation = validateRequiredFields('schedule', {
                pastor_id: pastorIdForValidation,
                scheduled_date: scheduledDateForValidation,
                location: locationForValidation
            });
            if (!requiredValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: requiredValidation.message,
                    errorCode: 'MISSING_REQUIRED_FIELDS'
                });
            }
        }

        // Perform the update
        const result = await updateDiscipleshipRequest(id, updatePayload);

        // Log status change
        if (updatePayload.status && updatePayload.status !== currentStatus) {
            await auditTrailRecords.createAuditLog({
                action_type: 'DISCIPLESHIP_STATUS_CHANGED',
                module: 'Discipleship',
                description: JSON.stringify({
                    request_id: id,
                    firstname,
                    lastname,
                    previous_status: currentStatus,
                    new_status: updatePayload.status
                }),
                user_id: req.user?.acc_id || null,
                user_email: req.user?.email || null,
                user_name: req.user?.firstname || null,
                user_position: req.user?.position || null
            });

            // Send email notification for status change
            if (email) {
                let pastor_name = '';
                if (updatePayload.pastor_id) {
                    try {
                        const [pastorRows] = await query(`
                            SELECT m.firstname, m.lastname 
                            FROM tbl_members m 
                            JOIN tbl_accounts a ON m.email = a.email 
                            WHERE a.acc_id = ?
                        `, [updatePayload.pastor_id]);
                        if (pastorRows.length > 0) {
                            pastor_name = `${pastorRows[0].firstname} ${pastorRows[0].lastname}`;
                        }
                    } catch (e) {
                        console.error('Error fetching pastor name for email:', e);
                    }
                }

                await sendStatusNotificationEmail({
                    email,
                    firstname,
                    lastname,
                    request_type: effectiveRequestType,
                    status: updatePayload.status,
                    scheduled_date: updatePayload.scheduled_date !== undefined ? updatePayload.scheduled_date : currentScheduledDate,
                    pastor_name,
                    location: updatePayload.location !== undefined ? updatePayload.location : currentLocation
                });
            }
        }

        // Log scheduling
        if (updatePayload.scheduled_date && updatePayload.scheduled_date !== currentScheduledDate) {
            await auditTrailRecords.createAuditLog({
                action_type: 'DISCIPLESHIP_SCHEDULED',
                module: 'Discipleship',
                description: JSON.stringify({
                    request_id: id,
                    firstname,
                    lastname,
                    previous_date: currentScheduledDate,
                    new_date: updatePayload.scheduled_date
                }),
                user_id: req.user?.acc_id || null,
                user_email: req.user?.email || null,
                user_name: req.user?.firstname || null,
                user_position: req.user?.position || null
            });

            // Send email notification for scheduling if status is Scheduled
            if (email && updatePayload.status === 'Scheduled') {
                let pastor_name = '';
                if (updatePayload.pastor_id) {
                    try {
                        const [pastorRows] = await query('SELECT firstname, lastname FROM tbl_churchleaders WHERE acc_id = ?', [updatePayload.pastor_id]);
                        if (pastorRows.length > 0) {
                            pastor_name = `${pastorRows[0].firstname} ${pastorRows[0].lastname}`;
                        }
                    } catch (e) {
                        console.error('Error fetching pastor:', e);
                    }
                }

                await sendStatusNotificationEmail({
                    email,
                    firstname,
                    lastname,
                    request_type: effectiveRequestType,
                    status: 'Scheduled',
                    scheduled_date: updatePayload.scheduled_date,
                    pastor_name,
                    location: updatePayload.location !== undefined ? updatePayload.location : currentLocation
                });
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: 'UPDATE_ERROR'
        });
    }
});

// ADMIN: Promote from Salvation to Bible Study
// This clears the salvation record (sets to Promoted) and creates a record in tbl_biblestudy_requests.
router.post('/promote-to-bible-study/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            isDecided = true,
            scheduled_date,
            pastor_id,
            location,
            notes
        } = req.body;

        const [currentRows] = await query(
            'SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [id]
        );
        if (currentRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        const current = currentRows[0];

        if (current.request_type !== 'Salvation') {
            return res.status(400).json({ success: false, message: 'Only Salvation Talks can be promoted.' });
        }

        // 1. Create Bible Study record in tbl_biblestudy_requests IF user is decided
        // (Even if not decided, we might want to track it, but based on user req, 
        // if they hesitate we send a form link. Once they fill the form, it will create a record.)
        if (isDecided) {
            const { createBibleStudyRequest } = require('../../dbHelpers/services/biblestudyRecords');
            await createBibleStudyRequest({
                salvation_id: id,
                firstname: current.firstname,
                lastname: current.lastname,
                middle_name: current.middle_name,
                email: current.email,
                phone_number: current.phone_number,
                birthdate: current.birthdate,
                age: current.age,
                gender: current.gender,
                address: current.address,
                civil_status: current.civil_status,
                profession: current.profession,
                spouse_name: current.spouse_name,
                marriage_date: current.marriage_date,
                children: current.children,
                guardian_name: current.guardian_name,
                guardian_contact: current.guardian_contact,
                guardian_relationship: current.guardian_relationship,
                scheduled_date,
                pastor_id,
                location,
                notes,
                status: scheduled_date ? 'Scheduled' : 'Pending'
            });

            // Send confirmation email
            if (current.email) {
                let pastor_name = 'Church Leader';
                if (pastor_id) {
                    try {
                        const [pastorRows] = await query('SELECT firstname, lastname FROM tbl_churchleaders WHERE acc_id = ?', [pastor_id]);
                        if (pastorRows.length > 0) {
                            pastor_name = `Pastor ${pastorRows[0].firstname} ${pastorRows[0].lastname}`;
                        }
                    } catch (e) {
                        console.error('Error fetching pastor for email:', e);
                    }
                }

                await emailHelper.sendBibleStudyInvitation({
                    email: current.email,
                    firstname: current.firstname,
                    lastname: current.lastname,
                    scheduled_date,
                    location,
                    pastor_name
                });
            }
        } else {
            // Hesitant: Send form link
            const frontendUrl = process.env.FRONTEND_URL1 || 'http://localhost:5173';
            const bibleStudyLink = `${frontendUrl}/beoneofus/bible-study?ref=${id}`;
            await emailHelper.sendBibleStudyFormLink({
                email: current.email,
                firstname: current.firstname,
                lastname: current.lastname,
                formLink: bibleStudyLink,
                request_id: id
            });
        }

        // 2. Mark Salvation as Promoted (Only if step 1 created the Bible Study record)
        if (isDecided) {
            await query(
                'UPDATE tbl_discipleship_requests SET status = \'Promoted\', date_updated = NOW() WHERE request_id = ?',
                [id]
            );
        }


        // Audit Log
        await auditTrailRecords.createAuditLog({
            action_type: 'SALVATION_PROMOTED',
            module: 'Discipleship',
            description: `Promoted ${id} to Bible Study. Decided: ${isDecided}`,
            user_id: req.user?.acc_id,
            user_name: req.user?.firstname
        });

        res.json({ 
            success: true, 
            message: isDecided ? 'Bible Study record created and scheduled!' : 'Record updated and invitation form link sent.' 
        });

    } catch (error) {
        console.error('Promote error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Promote to Baptism (Direct)
router.post('/promote/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get current status
        const [currentRows] = await query('SELECT status, request_type, firstname, lastname, email FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (currentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }

        const currentStatus = currentRows[0].status;
        const currentRequestType = currentRows[0].request_type;

        // Validate - only Completed status can be promoted
        if (currentStatus !== 'Completed') {
            return res.status(400).json({
                success: false,
                message: `Cannot promote request with status "${currentStatus}". Only "Completed" requests can be promoted to water baptism.`,
                errorCode: 'INVALID_STATUS_FOR_PROMOTION'
            });
        }

        // Flow rule: promotion happens after Bible Study is completed.
        if (currentRequestType === 'Salvation') {
            return res.status(400).json({
                success: false,
                message: 'Cannot promote yet. Please complete the Bible Study stage first before promoting to water baptism.',
                errorCode: 'BIBLE_STUDY_REQUIRED'
            });
        }

        const result = await promoteToBaptism(id);

        // Log promotion
        await auditTrailRecords.createAuditLog({
            action_type: 'DISCIPLESHIP_PROMOTED',
            module: 'Discipleship',
            description: JSON.stringify({
                request_id: id,
                firstname: currentRows[0].firstname,
                lastname: currentRows[0].lastname,
                email: currentRows[0].email,
                previous_status: 'Completed',
                new_status: 'Promoted'
            }),
            user_id: req.user?.acc_id || null,
            user_email: req.user?.email || null,
            user_name: req.user?.firstname || null,
            user_position: req.user?.position || null
        });

        res.json(result);
    } catch (error) {
        console.error('Promote error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: 'PROMOTE_ERROR'
        });
    }
});

// ADMIN: Send Baptism Invitation
router.post('/invite-baptism/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { isDecided } = req.body;

        // Get current status
        const [currentRows] = await query('SELECT status, request_type, firstname, lastname, email FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (currentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }

        const currentStatus = currentRows[0].status;
        const currentRequestType = currentRows[0].request_type;

        // Can't invite if already promoted
        if (currentStatus === 'Promoted') {
            return res.status(400).json({
                success: false,
                message: 'This request has already been promoted to water baptism.',
                errorCode: 'ALREADY_PROMOTED'
            });
        }

        // Flow rule: invitation/promotion happens after Bible Study is completed.
        if (currentRequestType === 'Salvation') {
            return res.status(400).json({
                success: false,
                message: 'Cannot invite to water baptism yet. Please complete the Bible Study stage first.',
                errorCode: 'BIBLE_STUDY_REQUIRED'
            });
        }

        const result = await inviteToBaptism(id, isDecided);

        // Log invitation
        await auditTrailRecords.createAuditLog({
            action_type: 'DISCIPLESHIP_INVITATION_SENT',
            module: 'Discipleship',
            description: JSON.stringify({
                request_id: id,
                firstname: currentRows[0].firstname,
                lastname: currentRows[0].lastname,
                isDecided,
                status: currentStatus
            }),
            user_id: req.user?.acc_id || null,
            user_email: req.user?.email || null,
            user_name: req.user?.firstname || null,
            user_position: req.user?.position || null
        });

        res.json(result);
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: 'INVITE_ERROR'
        });
    }
});

// ADMIN: Reject Salvation Talk with Reason and Suggestions
router.post('/reject/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }

        // 1. Get request details
        const [rows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        const request = rows[0];

        // 2. Fetch next 3 available slots from church availability
        // Reuse handleAvailableSlotsRequest logic or simplify for email
        const timezone = 'Asia/Manila';
        const start = moment().tz(timezone).add(1, 'day').startOf('day');
        const availableDates = [];
        
        // Scan next 14 days for up to 3 days with slots
        for (let i = 0; i < 14 && availableDates.length < 3; i++) {
            const date = start.clone().add(i, 'days').format('YYYY-MM-DD');
            const generated = generateCandidateSlotsForDate({ serviceType: 'salvation', dateStr: date, timezone });
            if (!generated.success) continue;

            // Simple check for booked slots on this specific day
            const [booked] = await query(
                `SELECT DATE_FORMAT(scheduled_date, '%Y-%m-%d %H:%i:%s') AS slot_datetime 
                 FROM tbl_discipleship_requests 
                 WHERE request_type = 'Salvation' AND status IN ('Pending', 'Scheduled') AND DATE(scheduled_date) = ?`,
                [date]
            );
            const bookedSet = new Set(booked.map(r => r.slot_datetime));
            
            // EXCLUDE the rejected slot so they don't pick it again
            const rejectedSlotStr = moment(request.scheduled_date).format('YYYY-MM-DD HH:mm:ss');
            const available = generated.data.filter(slot => {
                const isBooked = bookedSet.has(slot.datetime);
                const isRejectedSameSlot = slot.datetime === rejectedSlotStr;
                return !isBooked && !isRejectedSameSlot;
            });

            if (available.length > 0) {
                availableDates.push({
                    date: date,
                    timeSlots: available // Include all available morning slots for the day
                });
            }
        }

        // 3. Update status to Rejected
        await query(
            'UPDATE tbl_discipleship_requests SET status = \'Rejected\', notes = ?, date_updated = NOW() WHERE request_id = ?',
            [`Rejected: ${reason}`, id]
        );

        // 4. Send Email
        if (request.email) {
            const frontendUrl = process.env.FRONTEND_URL1 || 'http://localhost:5173';
            const rescheduleLink = `${frontendUrl}/beoneofus/discipleship?ref=${id}`;

            await emailHelper.sendSalvationRejectionWithReason({
                email: request.email,
                firstname: request.firstname,
                lastname: request.lastname,
                reason: reason,
                availableSlots: availableDates,
                formLink: rescheduleLink
            });
        }

        // 5. Audit Log
        await auditTrailRecords.createAuditLog({
            action_type: 'SALVATION_REJECTED',
            module: 'Discipleship',
            description: `Rejected ${id}. Reason: ${reason}. Suggestions sent.`,
            user_id: req.user?.acc_id,
            user_name: req.user?.firstname
        });

        res.json({ success: true, message: 'Request rejected and email with suggestions sent successfully.' });

    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Reject Bible Study Request with Reason and Suggestions
router.post('/biblestudy/reject/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }

        // 1. Get request details
        const [rows] = await query('SELECT * FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        const request = rows[0];

        // 2. Fetch next 3 available slots for Bible Study
        const timezone = 'Asia/Manila';
        const start = moment().tz(timezone).add(1, 'day').startOf('day');
        const availableDates = [];
        
        for (let i = 0; i < 21 && availableDates.length < 3; i++) {
            const date = start.clone().add(i, 'days').format('YYYY-MM-DD');
            const generated = generateCandidateSlotsForDate({ serviceType: 'bible_study', dateStr: date, timezone });
            if (!generated.success) continue;

            const [booked] = await query(
                `SELECT DATE_FORMAT(scheduled_date, '%Y-%m-%d %H:%i:%s') AS slot_datetime 
                 FROM tbl_biblestudy_requests 
                 WHERE status IN ('Pending', 'Scheduled', 'Rejected') AND DATE(scheduled_date) = ?`,
                [date]
            );
            const bookedSet = new Set(booked.map(r => r.slot_datetime));
            
            // Exclude the rejected slot
            const rejectedSlotStr = moment(request.scheduled_date).format('YYYY-MM-DD HH:mm:ss');
            const available = generated.data.filter(slot => {
                const isBooked = bookedSet.has(slot.datetime);
                const isRejectedSameSlot = slot.datetime === rejectedSlotStr;
                return !isBooked && !isRejectedSameSlot;
            });

            if (available.length > 0) {
                availableDates.push({
                    date: date,
                    timeSlots: available
                });
            }
        }

        // 3. Update status to Rejected
        await query(
            'UPDATE tbl_biblestudy_requests SET status = \'Rejected\', notes = ?, date_updated = NOW() WHERE request_id = ?',
            [`Rejected: ${reason}`, id]
        );

        // 4. Send Email
        if (request.email) {
            const frontendUrl = process.env.FRONTEND_URL1 || 'http://localhost:5173';
            // Bible Study might use a different link if implemented similarly to Salvation
            const rescheduleLink = `${frontendUrl}/beoneofus/bible-study?ref=${id}`;

            await emailHelper.sendSalvationRejectionWithReason({ // Reusing template but for Bible Study
                email: request.email,
                firstname: request.firstname,
                lastname: request.lastname,
                reason: reason,
                availableSlots: availableDates,
                formLink: rescheduleLink,
                isBibleStudy: true // Added flag for potential template differences
            });
        }

        // 5. Audit Log
        await auditTrailRecords.createAuditLog({
            action_type: 'BIBLE_STUDY_REJECTED',
            module: 'BibleStudy',
            description: `Rejected ${id}. Reason: ${reason}. Suggestions sent.`,
            user_id: req.user?.acc_id,
            user_name: req.user?.firstname
        });

        res.json({ success: true, message: 'Bible Study request rejected and email sent.' });

    } catch (error) {
        console.error('Bible Study Reject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Archive Request (Soft Delete)
router.delete('/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body || {}; // DELETE requests may not have body

        // Get request details before archiving
        const [currentRows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (currentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }

        const requestData = currentRows[0];

        // Archive instead of hard delete
        const result = await archiveDiscipleshipRequest(id, {
            archived_at: new Date(),
            archived_by: req.user?.acc_id || 'admin',
            archive_reason: reason || 'Deleted by admin'
        });

        // Log archival
        await auditTrailRecords.createAuditLog({
            action_type: 'DISCIPLESHIP_ARCHIVED',
            module: 'Discipleship',
            description: JSON.stringify({
                request_id: id,
                firstname: requestData.firstname,
                lastname: requestData.lastname,
                archive_reason: reason || 'Deleted by admin'
            }),
            user_id: req.user?.acc_id || null,
            user_email: req.user?.email || null,
            user_name: req.user?.firstname || null,
            user_position: req.user?.position || null
        });

        res.json({
            success: true,
            message: 'Request archived successfully',
            data: result.data
        });
    } catch (error) {
        console.error('Archive error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: 'ARCHIVE_ERROR'
        });
    }
});

// ADMIN: Bulk Archive Requests
router.post('/bulk-archive', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { requestIds, reason } = req.body;

        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request: requestIds must be a non-empty array'
            });
        }

        const archived = [];
        const failed = [];

        for (const request_id of requestIds) {
            try {
                // Get request data
                const [rows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);

                if (rows.length === 0) {
                    failed.push({ 
                        request_id, 
                        error: 'Not found', 
                        reason: 'Record does not exist' 
                    });
                    continue;
                }

                const requestData = rows[0];

                // Archive the request
                await archiveDiscipleshipRequest(request_id, {
                    archived_at: new Date(),
                    archived_by: req.user?.acc_id || 'admin',
                    archive_reason: reason || 'Archived by admin'
                });

                // Log individual archival
                await auditTrailRecords.createAuditLog({
                    action_type: 'DISCIPLESHIP_ARCHIVED',
                    module: 'Discipleship',
                    description: JSON.stringify({
                        request_id,
                        firstname: requestData.firstname,
                        lastname: requestData.lastname,
                        archive_reason: reason || 'Archived by admin'
                    }),
                    user_id: req.user?.acc_id || null,
                    user_email: req.user?.email || null,
                    user_name: req.user?.firstname || null,
                    user_position: req.user?.position || null
                });

                archived.push(request_id);
            } catch (err) {
                console.error(`Error archiving ${request_id}:`, err);
                failed.push({ 
                    request_id, 
                    error: err.message, 
                    reason: 'Database error' 
                });
            }
        }

        // Log bulk archival summary
        if (archived.length > 0) {
            await auditTrailRecords.createAuditLog({
                action_type: 'DISCIPLESHIP_BULK_ARCHIVED',
                module: 'Discipleship',
                description: JSON.stringify({
                    archived_count: archived.length,
                    failed_count: failed.length,
                    request_ids: archived,
                    archive_reason: reason
                }),
                user_id: req.user?.acc_id || null,
                user_email: req.user?.email || null,
                user_name: req.user?.firstname || null,
                user_position: req.user?.position || null
            });
        }

        res.json({
            success: true,
            message: `Successfully archived ${archived.length} request(s)`,
            data: {
                archived,
                failed
            }
        });
    } catch (error) {
        console.error('Bulk archive error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: 'BULK_ARCHIVE_ERROR'
        });
    }
});


module.exports = router;
