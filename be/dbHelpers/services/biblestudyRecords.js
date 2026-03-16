const { query } = require('../../database/db');
const moment = require('moment-timezone');
const { sendBibleStudyDetails } = require('../emailHelper');
const { validateSelectedSlot } = require('../../utils/scheduling');

moment.tz.setDefault('Asia/Manila');

/**
 * Get next biblestudy_id
 */
async function getNextBibleStudyId() {
    try {
        const sql = 'SELECT MAX(request_id) AS max_id FROM tbl_biblestudy_requests';
        const [rows] = await query(sql);
        const maxId = rows[0]?.max_id || null;

        if (!maxId) return 'BSR000001';

        const numericMatch = maxId.match(/\d+$/);
        if (numericMatch) {
            const numericPart = parseInt(numericMatch[0]);
            return `BSR${String(numericPart + 1).padStart(6, '0')}`;
        }
        return 'BSR000001';
    } catch (error) {
        console.error('Error generating Bible Study ID:', error);
        throw error;
    }
}

/**
 * Create a new Bible Study request (usually via promotion from Salvation)
 */
async function createBibleStudyRequest(data) {
    try {
        const request_id = await getNextBibleStudyId();
        const {
            salvation_id = null,
            firstname,
            lastname,
            email,
            phone_number,
            address = null,
            scheduled_date,
            pastor_id,
            location,
            notes
        } = data;

        if (!firstname || !lastname || !email || !phone_number) {
            throw new Error('Missing required fields: firstname, lastname, email, phone_number');
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const { status: rawStatus = 'Pending' } = data;
        const status = String(rawStatus || 'Pending').trim();
        const allowedStatuses = new Set(['Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected', 'Promoted']);
        if (!allowedStatuses.has(status)) {
            throw new Error('Invalid status value');
        }

        if (scheduled_date) {
            const slotValidation = validateSelectedSlot({
                serviceType: 'bible_study',
                scheduledDateTimeStr: scheduled_date,
                timezone: 'Asia/Manila'
            });
            if (!slotValidation.valid) {
                throw new Error(slotValidation.message);
            }
        }

        // Prevent duplicate active requests by email (allow re-apply if cancelled/rejected)
        const [existing] = await query(
            "SELECT request_id FROM tbl_biblestudy_requests WHERE email = ? AND status IN ('Pending','Scheduled','Completed') LIMIT 1",
            [normalizedEmail]
        );
        if (existing.length > 0) {
            throw new Error('You already have an active Bible Study request. Please wait for our team to contact you.');
        }

        // Prevent double-booking of the selected slot (Pending/Scheduled blocks)
        if (scheduled_date) {
            const formattedSlot = moment.tz(scheduled_date, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], 'Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
            const [conflicts] = await query(
                "SELECT request_id FROM tbl_biblestudy_requests WHERE status IN ('Pending','Scheduled') AND scheduled_date = ? LIMIT 1",
                [formattedSlot]
            );
            if (conflicts.length > 0) {
                throw new Error('Selected time slot is no longer available. Please choose a different slot.');
            }
        }

        const formattedDate = scheduled_date ? moment(scheduled_date).format('YYYY-MM-DD HH:mm:ss') : null;

        // Backward compatibility: some DBs may not yet have an "address" column.
        let hasAddressColumn = false;
        try {
            const [columns] = await query("SHOW COLUMNS FROM tbl_biblestudy_requests LIKE 'address'");
            hasAddressColumn = Array.isArray(columns) && columns.length > 0;
        } catch (e) {
            hasAddressColumn = false;
        }

        let sql = '';
        let params = [];

        if (hasAddressColumn) {
            sql = `
                INSERT INTO tbl_biblestudy_requests (
                    request_id, salvation_id, firstname, lastname, email, phone_number,
                    address, scheduled_date, pastor_id, location, notes, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            params = [
                request_id, salvation_id, firstname, lastname, normalizedEmail, phone_number,
                address, formattedDate, pastor_id, location, notes, status
            ];
        } else {
            const notesWithAddress = address
                ? JSON.stringify({ address, notes: notes || null })
                : (notes || null);

            sql = `
                INSERT INTO tbl_biblestudy_requests (
                    request_id, salvation_id, firstname, lastname, email, phone_number,
                    scheduled_date, pastor_id, location, notes, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            params = [
                request_id, salvation_id, firstname, lastname, normalizedEmail, phone_number,
                formattedDate, pastor_id, location, notesWithAddress, status
            ];
        }

        await query(sql, params);

        return {
            success: true,
            message: status === 'Scheduled' ? 'Bible Study scheduled successfully' : 'Bible Study request submitted successfully',
            data: { request_id }
        };
    } catch (error) {
        console.error('Error creating Bible Study request:', error);
        throw error;
    }
}

/**
 * Get all Bible Study requests
 */
async function getAllBibleStudyRequests(params = {}) {
    try {
        const { page = 1, pageSize = 10, search = '', status = '' } = params;
        const offset = (page - 1) * pageSize;

        let sql = 'SELECT * FROM tbl_biblestudy_requests WHERE 1=1';
        const queryParams = [];

        if (search) {
            sql += ' AND (firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR request_id LIKE ?)';
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (status) {
            sql += ' AND status = ?';
            queryParams.push(status);
        }

        sql += ' ORDER BY date_created DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(pageSize), parseInt(offset));

        const [rows] = await query(sql, queryParams);

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM tbl_biblestudy_requests WHERE 1=1';
        const countParams = [];
        if (search) {
            countSql += ' AND (firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR request_id LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
            countSql += ' AND status = ?';
            countParams.push(status);
        }
        const [countRows] = await query(countSql, countParams);

        return {
            success: true,
            data: rows,
            pagination: {
                total: countRows[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(countRows[0].total / pageSize)
            }
        };
    } catch (error) {
        console.error('Error fetching Bible Study requests:', error);
        throw error;
    }
}

/**
 * Update Bible Study request
 */
async function updateBibleStudyRequest(id, data) {
    try {
        const { status, scheduled_date, pastor_id, location, notes } = data;
        
        const updates = [];
        const params = [];

        if (status) { updates.push('status = ?'); params.push(status); }
        if (scheduled_date !== undefined) { 
            updates.push('scheduled_date = ?'); 
            params.push(scheduled_date ? moment(scheduled_date).format('YYYY-MM-DD HH:mm:ss') : null); 
        }
        if (pastor_id !== undefined) { updates.push('pastor_id = ?'); params.push(pastor_id); }
        if (location !== undefined) { updates.push('location = ?'); params.push(location); }
        if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

        if (updates.length === 0) return { success: true, message: 'No changes made' };

        params.push(id);
        const sql = `UPDATE tbl_biblestudy_requests SET ${updates.join(', ')}, date_updated = NOW() WHERE request_id = ?`;
        
        await query(sql, params);

        return { success: true, message: 'Bible Study updated successfully' };
    } catch (error) {
        console.error('Error updating Bible Study:', error);
        throw error;
    }
}

module.exports = {
    createBibleStudyRequest,
    getAllBibleStudyRequests,
    updateBibleStudyRequest
};
