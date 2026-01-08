const { query } = require('../database/db');

/**
 * Get dashboard statistics - all totals in one query
 * Returns: members, events, transactions, and forms statistics
 */
async function getDashboardStats() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Format dates for SQL queries (YYYY-MM-DD)
    const currentMonthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const nextMonthStart = currentMonth === 11 
      ? `${currentYear + 1}-01-01`
      : `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-01`;
    const lastMonthStart = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`;
    
    // Get total members count
    const [memberCountResult] = await query(
      'SELECT COUNT(*) as total FROM tbl_members'
    );
    const totalMembers = memberCountResult[0]?.total || 0;
    
    // Get members added this month
    const [membersThisMonthResult] = await query(
      'SELECT COUNT(*) as total FROM tbl_members WHERE DATE_FORMAT(date_created, "%Y-%m") = ?',
      [`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`]
    );
    const membersThisMonth = membersThisMonthResult[0]?.total || 0;
    
    // Get total men count
    const [totalMenResult] = await query(
      'SELECT COUNT(*) as total FROM tbl_members WHERE UPPER(gender) = ?',
      ['M']
    );
    const totalMen = totalMenResult[0]?.total || 0;
    
    // Get total women count
    const [totalWomenResult] = await query(
      'SELECT COUNT(*) as total FROM tbl_members WHERE UPPER(gender) = ?',
      ['F']
    );
    const totalWomen = totalWomenResult[0]?.total || 0;
    
    // Get ongoing events today (ongoing events that are currently happening - started and not ended yet)
    const [activeEventsResult] = await query(
      `SELECT COUNT(*) as total FROM tbl_events 
       WHERE status = 'ongoing' 
       AND start_date <= NOW() 
       AND end_date >= NOW()`
    );
    const activeEvents = activeEventsResult[0]?.total || 0;
    
    // Get upcoming events (ongoing events with start_date > today)
    const [upcomingEventsResult] = await query(
      `SELECT COUNT(*) as total FROM tbl_events 
       WHERE status = 'ongoing' AND start_date > NOW()`
    );
    const upcomingEvents = upcomingEventsResult[0]?.total || 0;
    
    // Get current month donations total from tbl_tithes where status is 'completed'
    const [currentMonthDonationsResult] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM tbl_tithes 
       WHERE status = 'completed' 
       AND DATE_FORMAT(date_created, "%Y-%m") = ?`,
      [`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`]
    );
    const currentMonthDonations = parseFloat(currentMonthDonationsResult[0]?.total || 0);
    
    // Get last month donations total for comparison from tbl_tithes where status is 'completed'
    const [lastMonthDonationsResult] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM tbl_tithes 
       WHERE status = 'completed' 
       AND DATE_FORMAT(date_created, "%Y-%m") = ?`,
      [`${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}`]
    );
    const lastMonthDonations = parseFloat(lastMonthDonationsResult[0]?.total || 0);
    
    // Calculate percentage change
    let donationChangePercent = 0;
    let donationChangeText = 'No change from last month';
    if (lastMonthDonations > 0) {
      donationChangePercent = ((currentMonthDonations - lastMonthDonations) / lastMonthDonations) * 100;
      const sign = donationChangePercent >= 0 ? '+' : '';
      donationChangeText = `${sign}${donationChangePercent.toFixed(1)}% from last month`;
    } else if (currentMonthDonations > 0) {
      donationChangeText = '+100% from last month';
    }
    
    // Get total all-time donations from tbl_tithes where status is 'completed'
    const [totalAllDonationsResult] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM tbl_tithes 
       WHERE status = 'completed'`
    );
    const totalAllDonations = parseFloat(totalAllDonationsResult[0]?.total || 0);
    
    // Get total prayer request forms
    const [totalMessagesResult] = await query(
      'SELECT COUNT(*) as total FROM tbl_forms WHERE form_type = ?',
      ['prayer_request']
    );
    const totalMessages = totalMessagesResult[0]?.total || 0;
    
    // Get unread (pending) prayer request forms
    const [unreadMessagesResult] = await query(
      'SELECT COUNT(*) as total FROM tbl_forms WHERE form_type = ? AND status = ?',
      ['prayer_request', 'pending']
    );
    const unreadMessages = unreadMessagesResult[0]?.total || 0;
    
    // Get water baptisms scheduled this month (approved or ongoing status)
    // Count records with baptism_date this month OR approved/ongoing without a date
    const [waterBaptismThisMonthResult] = await query(
      `SELECT COUNT(*) as total FROM tbl_waterbaptism 
       WHERE status IN ('approved', 'ongoing') 
       AND (DATE_FORMAT(baptism_date, "%Y-%m") = ? OR baptism_date IS NULL)`,
      [`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`]
    );
    const waterBaptismThisMonth = waterBaptismThisMonthResult[0]?.total || 0;
    
    // Get child dedications scheduled this month (approved or ongoing status)
    // Count records with preferred_dedication_date this month OR approved/ongoing without a date
    const [childDedicationThisMonthResult] = await query(
      `SELECT COUNT(*) as total FROM tbl_childdedications 
       WHERE status IN ('approved', 'ongoing') 
       AND (DATE_FORMAT(preferred_dedication_date, "%Y-%m") = ? 
            OR preferred_dedication_date IS NULL)`,
      [`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`]
    );
    const childDedicationThisMonth = childDedicationThisMonthResult[0]?.total || 0;
    
    // Get burial services scheduled this month (approved or ongoing status)
    // Count records with service_date this month OR approved/ongoing without a date
    const [burialServiceThisMonthResult] = await query(
      `SELECT COUNT(*) as total FROM tbl_burialservice 
       WHERE status IN ('approved', 'ongoing') 
       AND (DATE_FORMAT(service_date, "%Y-%m") = ? OR service_date IS NULL)`,
      [`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`]
    );
    const burialServiceThisMonth = burialServiceThisMonthResult[0]?.total || 0;
    
    return {
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        members: {
          total: totalMembers,
          thisMonth: membersThisMonth,
          men: totalMen,
          women: totalWomen
        },
        events: {
          active: activeEvents,
          upcoming: upcomingEvents
        },
        donations: {
          currentMonth: currentMonthDonations,
          lastMonth: lastMonthDonations,
          changePercent: donationChangePercent,
          changeText: donationChangeText,
          totalAll: totalAllDonations
        },
        messages: {
          total: totalMessages,
          unread: unreadMessages
        },
        churchServices: {
          waterBaptism: waterBaptismThisMonth,
          childDedication: childDedicationThisMonth,
          burialService: burialServiceThisMonth
        }
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}

module.exports = {
  getDashboardStats
};

