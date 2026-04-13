const express = require('express');
const moment = require('moment');
const {
  createWaterBaptism,
  getAllWaterBaptisms,
  getWaterBaptismById,
  getWaterBaptismByMemberId,
  updateWaterBaptism,
  deleteWaterBaptism,
  bulkDeleteWaterBaptisms,
  bulkCompleteWaterBaptismsWithAccount,
  processBaptismCompletion,
  exportWaterBaptismsToExcel
} = require('../../dbHelpers/services/waterBaptismRecords');
const { getMemberById, createMember, getSpecificMemberByEmailAndStatus } = require('../../dbHelpers/church_records/memberRecords');
const { checkDuplicateAccount } = require('../../dbHelpers/church_records/accountRecords');
const { getAccountByEmail, createAccount } = require('../../dbHelpers/church_records/accountRecords');
const { sendAccountDetails, sendWaterBaptismDetails } = require('../../dbHelpers/emailHelper');
const { query } = require('../../database/db');
const { authenticateToken, checkAdminRole, checkPermission } = require('../../middleware/authMiddleware');

const router = express.Router();

// Removed strict Sunday restriction as requested

/**
 * Validates a baptism date format and timezone.
 * Returns { valid: true, parsed } on success.
 */
function validateBaptismDate(baptismDate) {
  if (!baptismDate) return { valid: true };

  const momentTz = require('moment-timezone');
  const timezone = 'Asia/Manila';

  // Parse explicitly in Manila timezone.
  const parsed = momentTz.tz(baptismDate, ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', moment.ISO_8601], timezone);

  if (!parsed.isValid()) {
    return { valid: false, message: 'Invalid baptism date format. Please use YYYY-MM-DD.' };
  }

  return { valid: true, parsed };
}

/**
 * CREATE - Insert a new water baptism record
 */
router.post('/createWaterBaptism', authenticateToken, checkPermission('ServicesGroup:Create'), async (req, res) => {
  try {
    if (req.body && req.body.baptism_date) {
      const dateValidation = validateBaptismDate(req.body.baptism_date);
      if (!dateValidation.valid) {
        return res.status(400).json({ success: false, message: dateValidation.message });
      }
    }

    const result = await createWaterBaptism(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error creating water baptism:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * READ ALL - Get all water baptism records
 */
router.get('/getAllWaterBaptisms', authenticateToken, checkPermission('ServicesGroup'), async (req, res) => {
  try {
    const result = await getAllWaterBaptisms(req.query);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/getAllWaterBaptisms', authenticateToken, checkPermission('ServicesGroup'), async (req, res) => {
  try {
    const result = await getAllWaterBaptisms(req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * READ ONE - Get by ID
 */
router.get('/getWaterBaptismById/:id', authenticateToken, checkPermission('ServicesGroup'), async (req, res) => {
  try {
    const result = await getWaterBaptismById(req.params.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * READ ONE - Get by Member ID
 */
router.get('/getWaterBaptismByMemberId/:memberId', authenticateToken, checkPermission('ServicesGroup'), async (req, res) => {
  try {
    const result = await getWaterBaptismByMemberId(req.params.memberId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * UPDATE - Update an existing baptism record
 */
router.put('/updateWaterBaptism/:id', authenticateToken, checkPermission('ServicesGroup:Process'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'ID required' });

    // Validate format only (Admins can override Sunday rule if needed manually)
    if (req.body.baptism_date) {
      const dateValidation = validateBaptismDate(req.body.baptism_date);
      if (!dateValidation.valid) {
        return res.status(400).json({ success: false, message: dateValidation.message });
      }
    }

    const result = await updateWaterBaptism(id, req.body);
    if (result.success) {
      // Check if we need to process completion
      const isCompleted = req.body.status && req.body.status.toLowerCase() === 'completed';
      if (isCompleted) {
        try { await processBaptismCompletion(id); } catch(e) {}
      }

      // 6. Automatic Archive for Rejected/Cancelled status
      const isRejected = req.body.status && (req.body.status.toLowerCase() === 'disapproved' || req.body.status.toLowerCase() === 'cancelled');
      if (isRejected) {
        try {
          const { archiveRecord } = require('../../dbHelpers/archiveRecords');
          // Fetch the full record data for archiving
          const recordCheck = await getWaterBaptismById(id);
          if (recordCheck.success && recordCheck.data) {
            await archiveRecord(
              'tbl_waterbaptism',
              String(id),
              recordCheck.data,
              req.user?.firstname || 'system',
              `System Auto-Archive: Status set to ${req.body.status}`
            );
            
            // After archiving, we should probably delete it from the original table to match the behavior of other modules
            await query('DELETE FROM tbl_waterbaptism WHERE baptism_id = ?', [id]);
            console.log(`✅ Auto-archived and deleted water baptism ${id} (Status: ${req.body.status})`);
          }
        } catch (archiveError) {
          console.error('Auto-archive failed for rejected water baptism:', archiveError);
        }
      }

      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE
 */
router.delete('/deleteWaterBaptism/:id', authenticateToken, checkPermission('ServicesGroup:Delete'), async (req, res) => {
  try {
    const archivedBy = req.user?.acc_id || null;
    const result = await deleteWaterBaptism(req.params.id, archivedBy, req.body.reason);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * BULK DELETE
 */
router.delete('/bulkDeleteWaterBaptisms', authenticateToken, checkPermission('ServicesGroup:Delete'), async (req, res) => {
  try {
    const archivedBy = req.user?.acc_id || null;
    const result = await bulkDeleteWaterBaptisms(req.body.baptismIds, archivedBy, req.body.reason);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * EXPORT
 */
router.get('/exportExcel', authenticateToken, checkPermission('ServicesGroup:Export'), async (req, res) => {
  try {
    const buffer = await exportWaterBaptismsToExcel(req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=baptisms_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/exportExcel', authenticateToken, checkPermission('ServicesGroup:Export'), async (req, res) => {
  try {
    const buffer = await exportWaterBaptismsToExcel(req.body);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=baptisms_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * CREATE - Non-member registration (STRICT SUNDAY)
 */
router.post('/register-non-member', async (req, res) => {
  try {
    if (req.body.baptism_date) {
      const dateValidation = validateBaptismDate(req.body.baptism_date);
      if (!dateValidation.valid) return res.status(400).json(dateValidation);
    }

    const { firstname, lastname, email, request_id } = req.body;
    if (!firstname || !lastname || !email) return res.status(400).json({ success: false, message: 'Required fields missing' });

    const baptismData = { ...req.body, is_member: false, status: 'pending' };
    const result = await createWaterBaptism(baptismData);
    
    if (result.success) {
      // HANDLE AUTO-PROMOTION from Bible Study
      if (request_id) {
         try {
           const [bsRows] = await query('SELECT notes FROM tbl_biblestudy_requests WHERE request_id = ?', [request_id]);
           if (bsRows.length > 0) {
             let notes;
             try {
               notes = typeof bsRows[0].notes === 'string' ? JSON.parse(bsRows[0].notes) : bsRows[0].notes;
             } catch (e) { notes = null; }

             if (notes && notes.companions) {
               let found = false;
               notes.companions = notes.companions.map(comp => {
                 // Match by email if provided, otherwise by name
                 const match = email ? comp.email === email : (comp.firstname === firstname && comp.lastname === lastname);
                 if (match) {
                   comp.status = 'Promoted';
                   found = true;
                 }
                 return comp;
               });

               if (found) {
                 await query('UPDATE tbl_biblestudy_requests SET notes = ? WHERE request_id = ?', [JSON.stringify(notes), request_id]);
                 console.log(`✅ Auto-promoted companion ${email || firstname} in Bible Study ${request_id}`);
               }
             }
           }
         } catch (promoErr) {
           console.error('Auto-promotion failed for water baptism:', promoErr.message);
         }
      }

      // Send email
      try {
        await sendWaterBaptismDetails({
          email: req.body.email,
          status: 'pending',
          recipientName: `${firstname} ${lastname}`,
          baptismDate: req.body.baptism_date || 'TBD',
          isMember: false
        });
      } catch(e) {}
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * EMAIL CHECK
 */
router.get('/check-email-exists', async (req, res) => {
  try {
    const sql = 'SELECT acc_id FROM tbl_accounts WHERE email = ?';
    const [rows] = await query(sql, [req.query.email]);
    res.json({ success: true, data: { exists: rows.length > 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * TIME SLOT CHECK
 */
router.get('/check-time-slot', async (req, res) => {
  try {
    const { baptism_date, baptism_time } = req.query;
    const sql = 'SELECT baptism_id FROM tbl_waterbaptism WHERE baptism_date = ? AND preferred_baptism_time = ? AND status = "approved"';
    const [rows] = await query(sql, [baptism_date, baptism_time]);
    res.json({ success: true, data: { isBooked: rows.length > 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * BULK COMPLETE
 */
router.put('/bulkCompleteWaterBaptisms', authenticateToken, checkPermission('ServicesGroup:Process'), async (req, res) => {
  try {
    const { baptismIds, completionDate, completionTime } = req.body;
    const result = await bulkCompleteWaterBaptismsWithAccount(baptismIds, completionDate, completionTime);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * AVAILABLE SLOTS (MANUAL + DYNAMIC)
 */
router.get('/available-slots', async (req, res) => {
  try {
    const timezone = 'Asia/Manila';
    const momentTz = require('moment-timezone');
    const start = momentTz().tz(timezone).add(1, 'day').startOf('day');
    const days = parseInt(req.query.days) || 30;
    const endExclusive = start.clone().add(days, 'days');

    // Fetch manual slots and subquery the booking counts
    const [manualRows] = await query(`
      SELECT 
             s.available_date,
             s.available_time,
             s.max_slots,
             DATE_FORMAT(s.available_time, '%H:%i') as time,
             CONCAT(DATE_FORMAT(s.available_date, '%Y-%m-%d'), ' ', DATE_FORMAT(s.available_time, '%H:%i:00')) as datetime,
             s.status as slot_status,
             (
               SELECT COUNT(*) 
               FROM tbl_waterbaptism b 
               WHERE LOWER(b.status) IN ('approved', 'pending', 'scheduled')
                 AND DATE(b.baptism_date) = DATE(s.available_date)
                 AND TIME(COALESCE(b.preferred_baptism_time, '00:00:00')) = TIME(s.available_time)
             ) as bookedCount,
             (
               SELECT GROUP_CONCAT(CONCAT(COALESCE(m.firstname, b.firstname), ' ', COALESCE(m.lastname, b.lastname)) SEPARATOR ', ')
               FROM tbl_waterbaptism b
               LEFT JOIN tbl_members m ON b.member_id = m.member_id
               WHERE LOWER(b.status) IN ('approved', 'pending', 'scheduled')
                 AND DATE(b.baptism_date) = DATE(s.available_date)
                 AND TIME(COALESCE(b.preferred_baptism_time, '00:00:00')) = TIME(s.available_time)
             ) as bookedMembersList
      FROM tbl_service_slots s
      WHERE s.service_type = 'water_baptism'
        AND s.status = 'Available'
        AND s.available_date >= ?
        AND s.available_date < ?
      ORDER BY s.available_date ASC, s.available_time ASC
    `, [
      start.format('YYYY-MM-DD'),
      endExclusive.format('YYYY-MM-DD')
    ]);

    const dateGroupsMap = {};

    manualRows.forEach(row => {
      const date = momentTz(row.available_date).format('YYYY-MM-DD');
      if (!dateGroupsMap[date]) {
        dateGroupsMap[date] = {
          date: date,
          dayName: momentTz(row.available_date).format('dddd'),
          timeSlots: []
        };
      }

      const bookedCount = row.bookedCount || 0;
      // Only include booked member names for authorized staff/admin
      const canSeePII = req.user && (
        (req.user.position || '').toLowerCase().includes('admin') || 
        (req.user.position || '').toLowerCase().includes('staff') ||
        (Array.isArray(req.user.permissions) && req.user.permissions.includes('ServicesGroup'))
      );

      dateGroupsMap[date].timeSlots.push({
        time: row.time,
        display: momentTz(row.datetime).format('h:mm A'),
        datetime: row.datetime,
        maxCapacity: row.max_slots,
        bookedCount: bookedCount,
        bookedMembers: canSeePII ? (row.bookedMembersList ? row.bookedMembersList.split(', ') : []) : [],
        isFull: bookedCount >= row.max_slots
      });
    });

    res.json({ success: true, data: Object.values(dateGroupsMap) });
  } catch (error) {
    console.error('Error fetching available water baptism slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
