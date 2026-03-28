const { query } = require('../database/db');
const NodeCache = require('node-cache');

// Initialize cache with 5-minute TTL (300 seconds)
const dashboardCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Get dashboard statistics - OPTIMIZED with fewer queries
 * Combines multiple count/sum queries into fewer database calls
 * Returns: members, events, transactions, and forms statistics
 */
async function getDashboardStats() {
  try {
    // Check if stats are in cache
    const cacheKey = 'dashboard_stats';
    const cachedData = dashboardCache.get(cacheKey);
    
    if (cachedData) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📊 Serving dashboard stats from CACHE');
      }
      return {
        ...cachedData,
        fromCache: true
      };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 Fetching FRESH dashboard stats from Database');
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Format dates for SQL queries (YYYY-MM-DD)
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const lastMonthStr = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}`;
    
    // =========================================================================
    // QUERY 1: Member counts (total, this month, men, women) - COMBINED
    // =========================================================================
    const [memberCounts] = await query(`
      SELECT 
        COUNT(*) as total_members,
        SUM(CASE WHEN DATE_FORMAT(date_created, "%Y-%m") = ? THEN 1 ELSE 0 END) as this_month,
        SUM(CASE WHEN UPPER(gender) = 'M' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN UPPER(gender) = 'F' THEN 1 ELSE 0 END) as total_women
      FROM tbl_members
    `, [currentMonthStr]);
    
    const totalMembers = memberCounts[0]?.total_members || 0;
    const membersThisMonth = memberCounts[0]?.this_month || 0;
    const totalMen = memberCounts[0]?.total_men || 0;
    const totalWomen = memberCounts[0]?.total_women || 0;
    
    // =========================================================================
    // QUERY 2: Event counts (active, upcoming) - COMBINED
    // =========================================================================
    const [eventCounts] = await query(`
      SELECT 
        SUM(CASE 
          WHEN status = 'ongoing' AND start_date <= NOW() AND end_date >= NOW() 
          THEN 1 ELSE 0 
        END) as active_events,
        SUM(CASE 
          WHEN status = 'ongoing' AND start_date > NOW() 
          THEN 1 ELSE 0 
        END) as upcoming_events
      FROM tbl_events
    `);
    
    const activeEvents = eventCounts[0]?.active_events || 0;
    const upcomingEvents = eventCounts[0]?.upcoming_events || 0;
    
    // =========================================================================
    // QUERY 3: Donation totals (current month, last month, all-time) - COMBINED
    // =========================================================================
    const [donationCounts] = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN DATE_FORMAT(date_created, "%Y-%m") = ? THEN amount ELSE 0 END), 0) as current_month,
        COALESCE(SUM(CASE WHEN DATE_FORMAT(date_created, "%Y-%m") = ? THEN amount ELSE 0 END), 0) as last_month,
        COALESCE(SUM(amount), 0) as total_all
      FROM tbl_tithes 
      WHERE status = 'completed'
    `, [currentMonthStr, lastMonthStr]);
    
    const currentMonthDonations = parseFloat(donationCounts[0]?.current_month || 0);
    const lastMonthDonations = parseFloat(donationCounts[0]?.last_month || 0);
    const totalAllDonations = parseFloat(donationCounts[0]?.total_all || 0);
    
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
    
    // =========================================================================
    // QUERY 4: Form counts (total messages, unread) - COMBINED
    // =========================================================================
    const [messageCounts] = await query(`
      SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as unread_messages
      FROM tbl_forms 
      WHERE form_type = 'prayer_request'
    `);
    
    const totalMessages = messageCounts[0]?.total_messages || 0;
    const unreadMessages = messageCounts[0]?.unread_messages || 0;
    
    // =========================================================================
    // QUERY 5: Church services this month COMBINED
    // =========================================================================
    const [serviceCounts] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM tbl_waterbaptism 
         WHERE status IN ('approved', 'ongoing') 
         AND (DATE_FORMAT(baptism_date, "%Y-%m") = ? OR baptism_date IS NULL)) as water_baptism,
        (SELECT COUNT(*) FROM tbl_childdedications 
         WHERE status IN ('approved', 'ongoing') 
         AND (DATE_FORMAT(preferred_dedication_date, "%Y-%m") = ? OR preferred_dedication_date IS NULL)) as child_dedication,
        (SELECT COUNT(*) FROM tbl_burialservice 
         WHERE status IN ('approved', 'ongoing') 
         AND (DATE_FORMAT(service_date, "%Y-%m") = ? OR service_date IS NULL)) as burial_service,
        (SELECT COUNT(*) FROM tbl_biblestudy_requests 
         WHERE status IN ('Pending', 'Scheduled') 
         AND (DATE_FORMAT(scheduled_date, "%Y-%m") = ? OR scheduled_date IS NULL)) as bible_study,
        (SELECT COUNT(*) FROM tbl_discipleship_requests 
         WHERE request_type = 'Salvation' AND status IN ('Pending', 'Scheduled') 
         AND (DATE_FORMAT(scheduled_date, "%Y-%m") = ? OR scheduled_date IS NULL)) as salvation_talk
    `, [currentMonthStr, currentMonthStr, currentMonthStr, currentMonthStr, currentMonthStr]);
    
    const waterBaptismThisMonth = serviceCounts[0]?.water_baptism || 0;
    const childDedicationThisMonth = serviceCounts[0]?.child_dedication || 0;
    const burialServiceThisMonth = serviceCounts[0]?.burial_service || 0;
    const bibleStudyThisMonth = serviceCounts[0]?.bible_study || 0;
    const salvationTalkThisMonth = serviceCounts[0]?.salvation_talk || 0;
    
    const result = {
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
          burialService: burialServiceThisMonth,
          bibleStudy: bibleStudyThisMonth,
          salvationTalk: salvationTalkThisMonth
        }
      }
    };

    // Store results in cache before returning
    dashboardCache.set(cacheKey, result);
    
    return result;

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}
/**
 * Function to clear dashboard cache manually (e.g., when a donation or record is added)
 */
function clearDashboardCache() {
  dashboardCache.del('dashboard_stats');
}

module.exports = {
  getDashboardStats,
  clearDashboardCache
};
