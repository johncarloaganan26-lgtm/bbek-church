const express = require('express');
const router = express.Router();
const {
    createDiscipleshipRequest,
    getAllDiscipleshipRequests,
    updateDiscipleshipRequest,
    promoteToBaptism,
    inviteToBaptism,
    archiveDiscipleshipRequest
} = require('../../dbHelpers/services/discipleshipRecords');
const { authenticateToken, checkAdminRole } = require('../../middleware/authMiddleware');
const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
const archiveRecord = require('../../dbHelpers/archiveRecords').archiveRecord;
const { query } = require('../../database/db');
const emailHelper = require('../../dbHelpers/emailHelper');

// =============================================================================
// ERROR TRAPPING CONSTANTS
// =============================================================================

// Valid status transitions: Current Status → [Allowed Next Statuses]
const VALID_STATUS_TRANSITIONS = {
    'Pending': ['Scheduled', 'Completed', 'Cancelled'],
    'Scheduled': ['Completed', 'Cancelled'],
    'Completed': ['Promoted'], // Can only be promoted, not cancelled
    'Promoted': [], // Terminal state - no transitions allowed
    'Cancelled': [] // Terminal state - no transitions allowed
};

// Church open days (discipleship only on Sundays)
const ALLOWED_SCHEDULE_DAY = 'Sunday';

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
function validateScheduledDate(scheduledDate) {
    if (!scheduledDate) {
        return { valid: true }; // No date to validate
    }
    
    const date = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if date is in the past
    if (date < today) {
        return {
            valid: false,
            message: 'Cannot schedule in the past. Please select a future date.'
        };
    }
    
    // Check if date is a Sunday (only allowed day for discipleship)
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (dayOfWeek !== ALLOWED_SCHEDULE_DAY) {
        return {
            valid: false,
            message: `Discipleship sessions can only be scheduled on ${ALLOWED_SCHEDULE_DAY}. Please select a Sunday date.`
        };
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
    let sql = 'SELECT request_id, status FROM tbl_discipleship_requests WHERE email = ?';
    const params = [email.toLowerCase().trim()];
    
    if (excludeRequestId) {
        sql += ' AND request_id != ?';
        params.push(excludeRequestId);
    }
    
    const [rows] = await query(sql, params);
    
    if (rows.length > 0) {
        const status = rows[0].status;
        const requestId = rows[0].request_id;
        
        if (['Pending', 'Scheduled'].includes(status)) {
            return {
                valid: false,
                message: `A discipleship request with this email already exists (${requestId}) with status "${status}". Please check the existing request instead of creating a duplicate.`
            };
        } else if (status === 'Completed') {
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
async function sendStatusNotificationEmail({ email, firstname, lastname, status, scheduled_date, pastor_name, location }) {
    const subject = `Discipleship Request Update - ${status}`;
    let message = '';
    
    switch (status) {
        case 'Scheduled':
            message = `
                <h2>Hello ${firstname} ${lastname},</h2>
                <p>Good news! Your discipleship session has been scheduled.</p>
                <p><strong>Details:</strong></p>
                <ul>
                    <li><strong>Date:</strong> ${new Date(scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                    <li><strong>Pastor:</strong> ${pastor_name}</li>
                    <li><strong>Location:</strong> ${location}</li>
                </ul>
                <p>Please arrive 15 minutes before your scheduled time.</p>
                <p>God bless you!</p>
            `;
            break;
            
        case 'Completed':
            message = `
                <h2>Congratulations ${firstname} ${lastname}!</h2>
                <p>You have successfully completed your discipleship session.</p>
                <p>We encourage you to continue your spiritual journey by joining our water baptism program.</p>
                <p>May God bless you abundantly!</p>
            `;
            break;
            
        case 'Cancelled':
            message = `
                <h2>Hello ${firstname} ${lastname},</h2>
                <p>We regret to inform you that your discipleship session has been cancelled.</p>
                <p>If you would like to reschedule, please submit a new request or contact our church office.</p>
                <p>God bless you!</p>
            `;
            break;
            
        default:
            message = `
                <h2>Hello ${firstname} ${lastname},</h2>
                <p>Your discipleship request status has been updated to: <strong>${status}</strong></p>
                <p>Thank you for your patience!</p>
            `;
    }
    
    try {
        await emailHelper.sendEmail(email, subject, message);
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
        
        // Check for duplicates before creating
        const duplicateCheck = await checkDuplicates(email);
        if (!duplicateCheck.valid) {
            return res.status(400).json({ 
                success: false, 
                message: duplicateCheck.message,
                errorCode: 'DUPLICATE_REQUEST'
            });
        }
        
        const result = await createDiscipleshipRequest(req.body);
        
        // Log successful submission
        await auditTrailRecords.createAuditLog({
            action_type: 'DISCIPLESHIP_SUBMITTED',
            module: 'Discipleship',
            description: JSON.stringify({ request_id: result.data?.request_id, firstname, lastname, email }),
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
        const { page, pageSize, search, status } = req.query;
        const result = await getAllDiscipleshipRequests({ page, pageSize, search, status });
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

// ADMIN: Update Request (Schedule/Status)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, scheduled_date, pastor_id, location, notes, firstname, lastname, email } = req.body;
        
        // Get current status
        const [currentRows] = await query('SELECT status, scheduled_date, pastor_id FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (currentRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }
        
        const currentStatus = currentRows[0].status;
        const currentPastorId = currentRows[0].pastor_id;
        const currentScheduledDate = currentRows[0].scheduled_date;
        
        // Validate status transition if status is being changed
        if (status && status !== currentStatus) {
            const statusValidation = validateStatusTransition(currentStatus, status);
            if (!statusValidation.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: statusValidation.message,
                    errorCode: 'INVALID_STATUS_TRANSITION'
                });
            }
        }
        
        // Validate scheduled date if being changed
        if (scheduled_date && scheduled_date !== currentScheduledDate) {
            const dateValidation = validateScheduledDate(scheduled_date);
            if (!dateValidation.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: dateValidation.message,
                    errorCode: 'INVALID_SCHEDULE_DATE'
                });
            }
            
            // Check for scheduling conflicts
            const pastorIdForCheck = pastor_id || currentPastorId;
            if (pastorIdForCheck) {
                const conflictCheck = await checkSchedulingConflict(pastorIdForCheck, scheduled_date, id);
                if (!conflictCheck.valid) {
                    return res.status(400).json({ 
                        success: false, 
                        message: conflictCheck.message,
                        errorCode: 'SCHEDULING_CONFLICT'
                    });
                }
            }
        }
        
        // Validate required fields if scheduling
        if (scheduled_date || pastor_id !== undefined) {
            const requiredValidation = validateRequiredFields('schedule', { pastor_id, scheduled_date, location });
            if (!requiredValidation.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: requiredValidation.message,
                    errorCode: 'MISSING_REQUIRED_FIELDS'
                });
            }
        }
        
        // Perform the update
        const result = await updateDiscipleshipRequest(id, req.body);
        
        // Log status change
        if (status && status !== currentStatus) {
            await auditTrailRecords.createAuditLog({
                action_type: 'DISCIPLESHIP_STATUS_CHANGED',
                module: 'Discipleship',
                description: JSON.stringify({
                    request_id: id,
                    firstname,
                    lastname,
                    previous_status: currentStatus,
                    new_status: status
                }),
                user_id: req.user?.acc_id || null,
                user_email: req.user?.email || null,
                user_name: req.user?.firstname || null,
                user_position: req.user?.position || null
            });
            
            // Send email notification for status change
            if (email) {
                let pastor_name = '';
                if (pastor_id && typeof pastor_id === 'number') {
                    try {
                        const [pastorRows] = await query('SELECT firstname, lastname FROM tbl_church_leaders WHERE acc_id = ?', [pastor_id]);
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
                    status,
                    scheduled_date,
                    pastor_name,
                    location
                });
            }
        }
        
        // Log scheduling
        if (scheduled_date && scheduled_date !== currentScheduledDate) {
            await auditTrailRecords.createAuditLog({
                action_type: 'DISCIPLESHIP_SCHEDULED',
                module: 'Discipleship',
                description: JSON.stringify({
                    request_id: id,
                    firstname,
                    lastname,
                    previous_date: currentScheduledDate,
                    new_date: scheduled_date
                }),
                user_id: req.user?.acc_id || null,
                user_email: req.user?.email || null,
                user_name: req.user?.firstname || null,
                user_position: req.user?.position || null
            });
            
            // Send email notification for scheduling if status is Scheduled
            if (email && status === 'Scheduled') {
                let pastor_name = '';
                if (pastor_id && typeof pastor_id === 'number') {
                    try {
                        const [pastorRows] = await query('SELECT firstname, lastname FROM tbl_church_leaders WHERE acc_id = ?', [pastor_id]);
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
                    status: 'Scheduled',
                    scheduled_date,
                    pastor_name,
                    location
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

// ADMIN: Promote to Baptism (Direct)
router.post('/promote/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get current status
        const [currentRows] = await query('SELECT status, firstname, lastname, email FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (currentRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }
        
        const currentStatus = currentRows[0].status;
        
        // Validate - only Completed status can be promoted
        if (currentStatus !== 'Completed') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot promote request with status "${currentStatus}". Only "Completed" requests can be promoted to water baptism.`,
                errorCode: 'INVALID_STATUS_FOR_PROMOTION'
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
        const [currentRows] = await query('SELECT status, firstname, lastname, email FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (currentRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }
        
        const currentStatus = currentRows[0].status;
        
        // Can't invite if already promoted
        if (currentStatus === 'Promoted') {
            return res.status(400).json({ 
                success: false, 
                message: 'This request has already been promoted to water baptism.',
                errorCode: 'ALREADY_PROMOTED'
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
            archived_by: req.user?.id || 'admin',
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
                status: requestData.status,
                reason: reason || 'No reason provided'
            }),
            user_id: req.user?.acc_id || null,
            user_email: req.user?.email || null,
            user_name: req.user?.firstname || null,
            user_position: req.user?.position || null
        });
        
        res.json(result);
    } catch (error) {
        console.error('Archive error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            errorCode: 'ARCHIVE_ERROR'
        });
    }
});

// PUBLIC: Get Registration Data by ID (For Registration Form)
router.get('/registration-data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await query('SELECT firstname, lastname, email, phone_number, birthdate, age, gender, address FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Request not found',
                errorCode: 'NOT_FOUND'
            });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Get Registration Data error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            errorCode: 'FETCH_ERROR'
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
                message: 'No requests selected',
                errorCode: 'NO_SELECTION'
            });
        }
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Reason is required for bulk archive',
                errorCode: 'MISSING_REASON'
            });
        }
        
        const archivedIds = [];
        const failedIds = [];
        
        for (const request_id of requestIds) {
            try {
                // Get request data
                const [rows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);
                
                if (rows.length === 0) {
                    failedIds.push({ request_id, error: 'Not found' });
                    continue;
                }
                
                const requestData = rows[0];
                
                // Prepare archive data
                const archiveDataText = JSON.stringify(requestData, null, 2);
                
                // Archive the record
                await archiveRecord('tbl_discipleship_requests', request_id, archiveDataText, req.user?.firstname || 'admin');
                
                // Delete from original table
                await query('DELETE FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);
                
                archivedIds.push(request_id);
            } catch (err) {
                console.error(`Error archiving ${request_id}:`, err);
                failedIds.push({ request_id, error: err.message });
            }
        }
        
        // Log bulk archival
        await auditTrailRecords.createAuditLog({
            action_type: 'DISCIPLESHIP_BULK_ARCHIVED',
            module: 'Discipleship',
            description: JSON.stringify({
                archived_count: archivedIds.length,
                failed_count: failedIds.length,
                request_ids: archivedIds,
                reason: reason
            }),
            user_id: req.user?.acc_id || null,
            user_email: req.user?.email || null,
            user_name: req.user?.firstname || null,
            user_position: req.user?.position || null
        });
        
        res.json({
            success: true,
            message: `Successfully archived ${archivedIds.length} requests`,
            data: {
                archived: archivedIds,
                failed: failedIds
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

// ADMIN: Bulk Mark Requests as Completed
// Only "Scheduled" status can be marked as completed
router.post('/bulk-complete', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { requestIds } = req.body;
        
        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No requests selected',
                errorCode: 'NO_SELECTION'
            });
        }
        
        const completedIds = [];
        const failedIds = [];
        
        for (const request_id of requestIds) {
            try {
                // Get request data
                const [rows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);
                
                if (rows.length === 0) {
                    failedIds.push({ request_id, error: 'Not found', reason: 'Record does not exist' });
                    continue;
                }
                
                const requestData = rows[0];
                
                // Only allow completing "Scheduled" status
                if (requestData.status !== 'Scheduled') {
                    failedIds.push({ 
                        request_id, 
                        error: `Invalid status: ${requestData.status}`, 
                        reason: 'Only "Scheduled" records can be marked as completed' 
                    });
                    continue;
                }
                
                // Update status to Completed
                await query(
                    'UPDATE tbl_discipleship_requests SET status = ?, completed_at = NOW() WHERE request_id = ?', 
                    ['Completed', request_id]
                );
                
                completedIds.push(request_id);
            } catch (err) {
                console.error(`Error completing ${request_id}:`, err);
                failedIds.push({ request_id, error: err.message, reason: 'Database error' });
            }
        }
        
        // Log bulk completion
        if (completedIds.length > 0) {
            await auditTrailRecords.createAuditLog({
                action_type: 'DISCIPLESHIP_BULK_COMPLETED',
                module: 'Discipleship',
                description: JSON.stringify({
                    completed_count: completedIds.length,
                    failed_count: failedIds.length,
                    request_ids: completedIds
                }),
                user_id: req.user?.acc_id || null,
                user_email: req.user?.email || null,
                user_name: req.user?.firstname || null,
                user_position: req.user?.position || null
            });
        }
        
        res.json({
            success: true,
            message: `Successfully completed ${completedIds.length} requests`,
            data: {
                completed: completedIds,
                failed: failedIds
            }
        });
    } catch (error) {
        console.error('Bulk complete error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            errorCode: 'BULK_COMPLETE_ERROR'
        });
    }
});

module.exports = router;
