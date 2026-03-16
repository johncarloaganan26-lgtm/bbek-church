const { query } = require('../database/db');
const emailHelper = require('../dbHelpers/emailHelper');
const moment = require('moment-timezone');

/**
 * Automatically reject Salvation requests that are Scheduled 
 * but the candidate didn't show up within 30 minutes of the scheduled time.
 */
async function autoRejectSalvationNoShows() {
  try {
    const nowManila = moment().tz('Asia/Manila');
    
    // Fetch all currently 'Scheduled' Salvation talks
    const sql = `
      SELECT request_id, firstname, lastname, email, scheduled_date 
      FROM tbl_discipleship_requests 
      WHERE status = 'Scheduled' 
      AND request_type = 'Salvation'
      AND scheduled_date IS NOT NULL
    `;

    const [requests] = await query(sql);

    if (requests.length === 0) return;

    for (const req of requests) {
      // scheduled_date is stored as YYYY-MM-DD HH:mm:ss in Manila time.
      const scheduledMoment = moment.tz(req.scheduled_date, 'YYYY-MM-DD HH:mm:ss', 'Asia/Manila');
      
      if (!scheduledMoment.isValid()) continue;

      // If current time is more than 30 minutes past the scheduled time
      const cutoffTime = scheduledMoment.clone().add(30, 'minutes');
      
      if (nowManila.isAfter(cutoffTime)) {
        console.log(`[Cron] Auto-rejecting no-show: ${req.request_id} (${req.firstname} ${req.lastname}). Scheduled: ${req.scheduled_date}`);

        // Update status to 'Rejected'
        await query(
          "UPDATE tbl_discipleship_requests SET status = 'Rejected', date_updated = NOW() WHERE request_id = ?",
          [req.request_id]
        );

        // Send rejection email
        if (emailHelper.sendSalvationRejection) {
          try {
            await emailHelper.sendSalvationRejection({
              email: req.email,
              firstname: req.firstname,
              lastname: req.lastname,
              scheduled_date: req.scheduled_date
            });
          } catch (emailError) {
            console.error(`[Cron] Failed to send rejection email to ${req.email}:`, emailError.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('[Cron] Error in autoRejectSalvationNoShows:', error);
  }
}

module.exports = {
  autoRejectSalvationNoShows
};
