const { query } = require('../../database/db');
const moment = require('moment-timezone');
const { createWaterBaptism } = require('./waterBaptismRecords');
const { sendDiscipleshipDetails, sendWaterBaptismInvitation } = require('../emailHelper');
const { validateSelectedSlot } = require('../../utils/scheduling');

// Set default timezone to Philippines (Asia/Manila, UTC+8)
moment.tz.setDefault('Asia/Manila');

/**
 * Discipleship Requests CRUD Operations
 * 
 * tbl_discipleship_requests schema:
 * - request_id (VARCHAR(50), PK)
 * - firstname, lastname, middle_name, email, phone_number
 * - birthdate, age, gender, address, civil_status, profession
 * - spouse_name, marriage_date, children
 * - request_type (ENUM: 'Salvation', 'Bible Study', 'Both')
 * - status (ENUM: 'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Promoted')
 * - scheduled_date, scheduled_time, notes
 * - date_created, date_updated
 */

/**
 * Get next request_id
 * @returns {Promise<String>} Next request_id
 */
async function getNextRequestId() {
    try {
        const sql = 'SELECT MAX(request_id) AS max_id FROM tbl_discipleship_requests';
        const [rows] = await query(sql);
        const maxId = rows[0]?.max_id || null;

        if (!maxId) return 'REQ000001';

        // Extract numeric part
        const numericMatch = maxId.match(/\d+$/);
        if (numericMatch) {
            const numericPart = parseInt(numericMatch[0]);
            return `REQ${String(numericPart + 1).padStart(6, '0')}`;
        }
        return 'REQ000001';
    } catch (error) {
        console.error('Error generating request ID:', error);
        throw error;
    }
}

/**
 * Create a new discipleship request
 * @param {Object} data - Request data
 */
async function createDiscipleshipRequest(data) {
    try {
        const request_id = await getNextRequestId();

        const {
            firstname, lastname, middle_name, email, phone_number,
            birthdate, age, gender, address, civil_status, profession,
            spouse_name, marriage_date, children,
            request_type = 'Salvation',
            notes,
            pastor_id = null,
            location = null,
            scheduled_date: scheduledDateTime = null,
            guardian_name = null,
            guardian_contact = null,
            guardian_relationship = null
        } = data;

        // Validation
        if (!firstname || !lastname || !email) {
            throw new Error('Missing required fields: firstname, lastname, email');
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // Age Verification
        if (age && parseInt(age) < 12) {
            throw new Error('Only 12 years old and above are allowed to request discipleship.');
        }

        // Email Duplication Check - block only active requests (allow re-apply if Cancelled/Rejected)
        const [existingReq] = await query(
            "SELECT request_id, status FROM tbl_discipleship_requests WHERE email = ? AND status IN ('Pending','Scheduled','Completed','Promoted') LIMIT 1",
            [normalizedEmail]
        );
        if (existingReq.length > 0) {
            throw new Error('You already have an active request with this email. Please wait for our team to contact you.');
        }

        // Email Duplication Check - Check Member Records
        const [existingMember] = await query('SELECT member_id FROM tbl_members WHERE email = ?', [normalizedEmail]);
        if (existingMember.length > 0) {
            throw new Error('This email is already registered as an official member. Please log in to your account.');
        }

        const normalizedType = String(request_type || 'Salvation').trim().toLowerCase();
        const serviceType = normalizedType === 'bible study' ? 'bible_study' : 'salvation';

        if (!scheduledDateTime) {
            throw new Error('Scheduled date and time is required.');
        }

        const slotValidation = validateSelectedSlot({
            serviceType,
            scheduledDateTimeStr: scheduledDateTime,
            timezone: 'Asia/Manila'
        });
        if (!slotValidation.valid) {
            throw new Error(slotValidation.message);
        }

        const scheduled_date = slotValidation.slot.format('YYYY-MM-DD HH:mm:ss');
        const scheduled_time = slotValidation.slot.format('HH:mm:ss');
        const initialStatus = 'Pending';

        // Prevent double-booking of the same slot.
        if (serviceType === 'salvation') {
            const [conflicts] = await query(
                "SELECT request_id FROM tbl_discipleship_requests WHERE request_type = 'Salvation' AND status IN ('Pending','Scheduled') AND scheduled_date = ? LIMIT 1",
                [scheduled_date]
            );
            if (conflicts.length > 0) {
                throw new Error('Selected time slot is no longer available. Please choose a different slot.');
            }
        }

        const sql = `
      INSERT INTO tbl_discipleship_requests (
        request_id, firstname, lastname, middle_name, email, phone_number,
        birthdate, age, gender, address, civil_status, profession,
        spouse_name, marriage_date, children, request_type, notes, pastor_id, location,
        scheduled_date, scheduled_time, status, guardian_name, guardian_contact, guardian_relationship
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const formattedBirth = birthdate ? moment(birthdate).format('YYYY-MM-DD') : null;
        const formattedMarriage = marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null;
        const childrenStr = (children && typeof children === 'object') ? JSON.stringify(children) : (children || null);
        const notesStr = (notes && typeof notes === 'object') ? JSON.stringify(notes) : (notes || null);

        // If this is a Bible Study request coming from a completed Salvation Talk,
        // mark the original Salvation record as "Promoted".
        if (serviceType === 'bible_study' && data.salvation_id) {
            await query(
                'UPDATE tbl_discipleship_requests SET status = "Promoted" WHERE request_id = ? AND request_type = "Salvation"',
                [data.salvation_id]
            );
        }

        const params = [
            request_id, firstname, lastname, middle_name || null, normalizedEmail, phone_number || null,
            formattedBirth, age || null, gender || null, address || null, civil_status || null, profession || null,
            spouse_name || null, formattedMarriage, childrenStr, request_type, notesStr, pastor_id, location,
            scheduled_date, scheduled_time, initialStatus, guardian_name, guardian_contact, guardian_relationship
        ];

        await query(sql, params);

        // Send Email Notification
        try {
            await sendDiscipleshipDetails({
                email: normalizedEmail,
                firstname,
                status: initialStatus,
                request_type,
                scheduled_date
            });
        } catch (emailError) {
            console.error('Email notification failed for discipleship request:', emailError);
        }

        return {
            success: true,
            message: 'Discipleship request submitted successfully',
            data: { request_id, ...data }
        };
    } catch (error) {
        console.error('Error creating discipleship request:', error);
        throw error;
    }
}

/**
 * Get all requests with filters
 */
async function getAllDiscipleshipRequests(options = {}) {
    try {
        const { status, search, request_type, page = 1, pageSize = 10 } = options;
        let sql = 'SELECT * FROM tbl_discipleship_requests WHERE 1=1';
        const params = [];

        if (status && status !== 'All Status') {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (request_type) {
            sql += ' AND request_type = ?';
            params.push(request_type);
        }

        if (search) {
            sql += ' AND (firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR request_id LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        sql += ' ORDER BY date_created DESC';

        // Pagination
        const limit = parseInt(pageSize);
        const offset = (parseInt(page) - 1) * limit;

        // Count total
        let whereClause = sql.substring(sql.indexOf('WHERE'));
        let orderByIdx = whereClause.lastIndexOf('ORDER BY');
        if (orderByIdx > -1) whereClause = whereClause.substring(0, orderByIdx);

        const [countResult] = await query(`SELECT COUNT(*) as total FROM tbl_discipleship_requests ${whereClause}`, params);
        const totalCount = countResult[0]?.total || 0;

        sql += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await query(sql, params);

        // Convert any Buffers (notes, address, etc.) to strings
        const cleanedRows = rows.map(row => {
            const formatted = { ...row };
            if (row.notes && Buffer.isBuffer(row.notes)) {
                formatted.notes = row.notes.toString('utf8');
            }
            if (row.address && Buffer.isBuffer(row.address)) {
                formatted.address = row.address.toString('utf8');
            }
            return formatted;
        });

        return {
            success: true,
            data: cleanedRows,
            pagination: {
                page: parseInt(page),
                pageSize: limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    } catch (error) {
        console.error('Error fetching requests:', error);
        throw error;
    }
}

/**
 * Update request status/schedule
 */
async function updateDiscipleshipRequest(request_id, updateData) {
    try {
        const { status, scheduled_date, scheduled_time, notes, pastor_id, location,
                middle_name, birthdate, age, gender, address, civil_status,
                profession, spouse_name, marriage_date, children,
                guardian_name, guardian_contact, guardian_relationship } = updateData;

        let sql = 'UPDATE tbl_discipleship_requests SET ';
        const updates = [];
        const params = [];

        if (status) { updates.push('status = ?'); params.push(status); }
        if (scheduled_date !== undefined) {
            updates.push('scheduled_date = ?');
            params.push(scheduled_date ? moment(scheduled_date).format('YYYY-MM-DD HH:mm:ss') : null);
        }
        if (scheduled_time !== undefined) {
            updates.push('scheduled_time = ?');
            params.push(scheduled_time || null);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            const notesStr = (notes && typeof notes === 'object') ? JSON.stringify(notes) : (notes || null);
            params.push(notesStr);
        }
        if (pastor_id !== undefined) { updates.push('pastor_id = ?'); params.push(pastor_id || null); }
        if (location !== undefined) { updates.push('location = ?'); params.push(location || null); }
        if (middle_name !== undefined) { updates.push('middle_name = ?'); params.push(middle_name); }
        if (birthdate !== undefined) { updates.push('birthdate = ?'); params.push(birthdate ? moment(birthdate).format('YYYY-MM-DD') : null); }
        if (age !== undefined) { updates.push('age = ?'); params.push(age || null); }
        if (gender !== undefined) { updates.push('gender = ?'); params.push(gender || null); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address || null); }
        if (civil_status !== undefined) { updates.push('civil_status = ?'); params.push(civil_status || null); }
        if (profession !== undefined) { updates.push('profession = ?'); params.push(profession || null); }
        if (spouse_name !== undefined) { updates.push('spouse_name = ?'); params.push(spouse_name || null); }
        if (marriage_date !== undefined) { updates.push('marriage_date = ?'); params.push(marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null); }
        if (children !== undefined) { updates.push('children = ?'); params.push(typeof children === 'object' ? JSON.stringify(children) : (children || null)); }
        if (guardian_name !== undefined) { updates.push('guardian_name = ?'); params.push(guardian_name || null); }
        if (guardian_contact !== undefined) { updates.push('guardian_contact = ?'); params.push(guardian_contact || null); }
        if (guardian_relationship !== undefined) { updates.push('guardian_relationship = ?'); params.push(guardian_relationship || null); }

        if (updates.length === 0) return { success: true, message: 'No changes' };

        sql += updates.join(', ') + ' WHERE request_id = ?';
        params.push(request_id);

        await query(sql, params);

        // Send Email Notification on status or schedule update
        if (status || scheduled_date) {
            try {
                // Get updated request details for email
                const [reqRows] = await query('SELECT firstname, email, status, scheduled_date, pastor_id, location FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);
                if (reqRows.length > 0) {
                    await sendDiscipleshipDetails(reqRows[0]);
                }
            } catch (emailError) {
                console.error('Email update failed for discipleship request:', emailError);
            }
        }

        return { success: true, message: 'Request updated successfully' };
    } catch (error) {
        console.error('Error updating request:', error);
        throw error;
    }
}

/**
 * Promote to Baptism
 * Copies data to tbl_waterbaptism and updates status to Promoted
 */
async function promoteToBaptism(request_id, isDecided = false) {
    try {
        // 1. Get request data
        const [rows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);
        if (rows.length === 0) throw new Error('Request not found');

        const req = rows[0];

        // 2. Prepare baptism data
        // Map fields from request to baptism schema
        const baptismData = {
            firstname: req.firstname,
            lastname: req.lastname,
            middle_name: req.middle_name,
            email: req.email,
            phone_number: req.phone_number,
            birthdate: req.birthdate,
            age: req.age,
            gender: req.gender,
            address: req.address,
            civil_status: req.civil_status,
            profession: req.profession,
            spouse_name: req.spouse_name,
            marriage_date: req.marriage_date,
            children: req.children,
            is_member: false, // They are visitors initially
            member_id: null,
            status: isDecided ? 'approved' : 'pending',
            desire_ministry: null,
            pastor_name: req.pastor_id || null, // Use the pastor from Phase 1
            location: req.location || null,    // Use the location from Phase 1
            baptism_date: isDecided ? moment().format('YYYY-MM-DD') : null, // Set date to now if decided
            baptism_time: isDecided ? moment().format('HH:mm:ss') : null,    // Set time to now if decided
            guardian_name: req.guardian_name,
            guardian_contact: req.guardian_contact,
            guardian_relationship: req.guardian_relationship
        };

        // 3. Create Water Baptism record
        const result = await createWaterBaptism(baptismData);

        if (result.success) {
            // NOTE: We don't update status to "Promoted" here anymore.
            // It will be updated when they actually schedule/submit the next stage form.

            return {
                success: true,
                message: 'Promoted to Baptism successfully (Record created but status pending follow-up)',
                data: result.data
            };
        } else {
            throw new Error('Failed to create baptism record');
        }
    } catch (error) {
        console.error('Error promoting to baptism:', error);
        throw error;
    }
}

/**
 * Send Water Baptism Invitation
 */
async function inviteToBaptism(request_id, isDecided = false) {
    try {
        const [rows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);
        if (rows.length === 0) throw new Error('Request not found');

        const req = rows[0];

        // If candidate is already decided (Promote), create a scheduled record
        if (isDecided) {
            console.log(`Candidate ${request_id} is decided. Promoting directly to Water Baptism...`);
            return await promoteToBaptism(request_id, true);
        }

        // If undecided/hesitant, just send the invitation email with registration link
        // A record in tbl_waterbaptism is NOT created until they submit the form.
        if (req.email) {
            await emailHelper.sendWaterBaptismInvitation({
                request_id: req.request_id,
                email: req.email,
                firstname: req.firstname,
                lastname: req.lastname,
                isDecided: false
            });
        }

        return { 
            success: true, 
            message: 'Water baptism invitation email sent successfully' 
        };
    } catch (error) {
        console.error('Error inviting to baptism:', error);
        throw error;
    }
}

async function deleteDiscipleshipRequest(request_id) {
    try {
        await query('DELETE FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);
        return { success: true, message: 'Request deleted successfully' };
    } catch (error) {
        console.error('Error deleting request:', error);
        throw error;
    }
}

/**
 * Archive Discipleship Request (Soft Delete)
 */
async function archiveDiscipleshipRequest(request_id, archiveInfo = {}) {
    try {
        // Get the request data before archiving
        const [requestRows] = await query('SELECT * FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);
        if (requestRows.length === 0) {
            throw new Error('Request not found');
        }

        const requestData = requestRows[0];
        const { archiveRecord } = require('../archiveRecords');
        const archiveDataText = JSON.stringify(requestData, null, 2);

        await archiveRecord('tbl_discipleship_requests', request_id, archiveDataText, archiveInfo.archived_by || 'admin', archiveInfo.archive_reason);

        // Hard delete from original table
        await query('DELETE FROM tbl_discipleship_requests WHERE request_id = ?', [request_id]);

        return {
            success: true,
            message: 'Request archived successfully',
            archived_id: request_id
        };
    } catch (error) {
        console.error('Error archiving request:', error);
        throw error;
    }
}

module.exports = {
    createDiscipleshipRequest,
    getAllDiscipleshipRequests,
    updateDiscipleshipRequest,
    promoteToBaptism,
    inviteToBaptism,
    deleteDiscipleshipRequest,
    archiveDiscipleshipRequest
};
