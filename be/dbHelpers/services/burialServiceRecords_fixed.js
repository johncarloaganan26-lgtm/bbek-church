const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { sendBurialDetails } = require('../emailHelper');
const { archiveBeforeDelete } = require('../archiveHelper');

async function getAllBurialServices(options = {}) {
  try {
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const sortBy = options.sortBy || null;
    const useFulltext = options.useFulltext === true;

    let countSql = 'SELECT COUNT(*) as total FROM tbl_burialservice bs INNER JOIN tbl_members m ON bs.member_id = m.member_id';
    let countParams = [];

    let sql = `SELECT bs.burial_id, bs.member_id, bs.relationship, bs.location, bs.pastor_name, bs.service_date, bs.status, bs.date_created, bs.deceased_name, bs.deceased_birthdate, bs.date_death, m.firstname, m.lastname, m.middle_name, CONCAT(m.firstname, IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''), ' ', m.lastname) as fullname FROM tbl_burialservice bs INNER JOIN tbl_members m ON bs.member_id = m.member_id`;
    const params = [];

    const whereConditions = [];
    let hasWhere = false;

    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      if (useFulltext) {
        const fulltextCondition = `MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE)`;
        const memberFulltextCondition = `MATCH(m.firstname, m.lastname, m.middle_name) AGAINST(? IN NATURAL LANGUAGE MODE)`;
        const searchCondition = `(${fulltextCondition} OR ${memberFulltextCondition})`;
        whereConditions.push(searchCondition);
        countParams.push(searchValue, searchValue);
        params.push(searchValue, searchValue);
      } else {
        const searchCondition = `(bs.burial_id LIKE ? OR bs.deceased_name LIKE ? OR bs.location LIKE ? OR bs.pastor_name LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ? OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ?)`;
        const searchPattern = `%${searchValue}%`;
        whereConditions.push(searchCondition);
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }
      hasWhere = true;
    }

    if (status && status !== 'All Statuses') {
      whereConditions.push('status = ?');
      countParams.push(status);
      params.push(status);
      hasWhere = true;
    }

    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (sortByValue && monthNames.includes(sortByValue)) {
      const monthIndex = monthNames.indexOf(sortByValue) + 1;
      whereConditions.push('MONTH(bs.service_date) = ? AND YEAR(bs.service_date) = YEAR(CURDATE())');
      countParams.push(monthIndex);
      params.push(monthIndex);
      hasWhere = true;
    } else if (sortByValue === 'This Month') {
      whereConditions.push('MONTH(bs.service_date) = MONTH(CURDATE()) AND YEAR(bs.service_date) = YEAR(CURDATE())');
      hasWhere = true;
    } else if (sortByValue === 'Last Month') {
      whereConditions.push('MONTH(bs.service_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(bs.service_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
      hasWhere = true;
    }

    if (hasWhere) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }

    let orderByClause = ' ORDER BY ';
    switch (sortByValue) {
      case 'Burial ID (A-Z)':
        orderByClause += 'bs.burial_id ASC';
        break;
      case 'Burial ID (Z-A)':
        orderByClause += 'bs.burial_id DESC';
        break;
      case 'Service Date (Newest)':
        orderByClause += 'bs.service_date DESC';
        break;
      case 'Service Date (Oldest)':
        orderByClause += 'bs.service_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'bs.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'bs.date_created ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'bs.status ASC';
        break;
      case 'Status (Pending First)':
        orderByClause += `CASE bs.status WHEN 'Pending' THEN 1 WHEN 'Approved' THEN 2 WHEN 'Disapproved' THEN 3 WHEN 'Completed' THEN 4 WHEN 'Cancelled' THEN 5 ELSE 6 END, bs.date_created DESC`;
        break;
      case 'Pastor Name (A-Z)':
        orderByClause += 'bs.pastor_name ASC';
        break;
      case 'Pastor Name (Z-A)':
        orderByClause += 'bs.pastor_name DESC';
        break;
      case 'Location (A-Z)':
        orderByClause += 'bs.location ASC';
        break;
      case 'Location (Z-A)':
        orderByClause += 'bs.location DESC';
        break;
      case 'Relevance':
        if (useFulltext && searchValue) {
          orderByClause += 'MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE) DESC, ';
          params.push(searchValue);
        }
        orderByClause += 'bs.date_created DESC';
        break;
      default:
        orderByClause += 'bs.date_created DESC';
    }
    sql += orderByClause;

    let finalLimit, finalOffset;

    if (page !== undefined && pageSize !== undefined) {
      const pageNum = parseInt(page) || 1;
      const size = parseInt(pageSize) || 10;
      finalLimit = size;
      finalOffset = (pageNum - 1) * size;
    } else if (limit !== undefined) {
      finalLimit = parseInt(limit) || 10;
      finalOffset = offset !== undefined ? parseInt(offset) : 0;
    } else {
      finalLimit = null;
      finalOffset = null;
    }

    const [countResult] = await query(countSql, countParams);
    const totalCount = countResult[0]?.total || 0;

    const [allStatusCountsResult] = await query('SELECT status, COUNT(*) as count FROM tbl_burialservice GROUP BY status');
    const summaryStats = {
      total: 0,
      completed: 0,
      pending: 0,
      approved: 0,
      disapproved: 0,
      cancelled: 0,
      scheduled: 0,
      ongoing: 0
    };
    
    const [allTotalResult] = await query('SELECT COUNT(*) as total FROM tbl_burialservice');
    summaryStats.total = allTotalResult[0]?.total || 0;
    
    allStatusCountsResult.forEach(row => {
      if (summaryStats.hasOwnProperty(row.status)) {
        summaryStats[row.status] = row.count;
      }
    });

    if (finalLimit !== null) {
      const limitValue = Math.max(1, parseInt(finalLimit) || 10);
      const offsetValue = Math.max(0, parseInt(finalOffset) || 0);

      if (offsetValue > 0) {
        sql += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
      } else {
        sql += ` LIMIT ${limitValue}`;
      }
    }

    const [rows] = await query(sql, params);

    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || rows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Burial services retrieved successfully',
      data: rows,
      count: rows.length,
      totalCount: totalCount,
      summaryStats: summaryStats,
      pagination: {
        page: currentPage,
        pageSize: currentPageSize,
        totalPages: totalPages,
        totalCount: totalCount,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    };
  } catch (error) {
    console.error('Error fetching burial services:', error);
    throw error;
  }
}

module.exports = { getAllBurialServices };
