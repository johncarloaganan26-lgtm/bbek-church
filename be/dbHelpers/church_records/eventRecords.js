const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const fs = require('fs');
const { archiveBeforeDelete } = require('../archiveHelper');

/**
 * Helper function to convert image to blob
 */
function convertImageToBlob(imageInput) {
  try {
    if (!imageInput) {
      return null;
    }
    if (Buffer.isBuffer(imageInput)) {
      return imageInput;
    }
    if (imageInput.buffer && Buffer.isBuffer(imageInput.buffer)) {
      return imageInput.buffer;
    }
    if (typeof imageInput === 'string' && (imageInput.startsWith('/') || imageInput.includes('\\') || imageInput.includes('/'))) {
      if (fs.existsSync(imageInput)) {
        return fs.readFileSync(imageInput);
      }
      return null;
    }
    if (typeof imageInput === 'string') {
      const base64Data = imageInput.includes(',') ? imageInput.split(',')[1] : image64Input;
      return Buffer.from(base64Data, 'base64');
    }
    return null;
  } catch (error) {
    console.error('Error converting image to blob:', error);
    throw new Error('Failed to convert image to blob: ' + error.message);
  }
}

function convertBlobToBase64(blob) {
  try {
    if (!blob) {
      return null;
    }
    if (Buffer.isBuffer(blob)) {
      return blob.toString('base64');
    }
    return null;
  } catch (error) {
    console.error('Error converting blob to base64:', error);
    return null;
  }
}

async function createEvent(eventData) {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      location,
      link = null,
      type,
      status = 'pending',
      date_created = new Date(),
      image = null,
      joined_members = null
    } = eventData;

    if (!title) throw new Error('Missing required field: title');
    if (!description) throw new Error('Missing required field: description');
    if (!start_date) throw new Error('Missing required field: start_date');
    if (!end_date) throw new Error('Missing required field: end_date');
    if (!location) throw new Error('Missing required field: location');
    if (!type) throw new Error('Missing required field: type');

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (isNaN(startDate.getTime())) throw new Error('Invalid start_date format');
    if (isNaN(endDate.getTime())) throw new Error('Invalid end_date format');
    if (endDate < startDate) throw new Error('end_date must be after or equal to start_date');

    const formattedStartDate = moment(start_date).format('YYYY-MM-DD HH:mm:ss');
    const formattedEndDate = moment(end_date).format('YYYY-MM-DD HH:mm:ss');
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    if (title.trim().length > 45) throw new Error('Title exceeds maximum length of 45 characters');
    if (description.trim().length > 500) throw new Error('Description exceeds maximum length of 500 characters');
    if (location.trim().length > 45) throw new Error('Location exceeds maximum length of 45 characters');
    if (link && link.trim().length > 45) throw new Error('Link exceeds maximum length of 45 characters');
    if (type.trim().length > 45) throw new Error('Type exceeds maximum length of 45 characters');
    if (status.trim().length > 45) throw new Error('Status exceeds maximum length of 45 characters');

    const imageBlob = convertImageToBlob(image);

    let joinedMembersJson = null;
    if (joined_members !== null && joined_members !== undefined) {
      if (Array.isArray(joined_members)) {
        joinedMembersJson = JSON.stringify(joined_members);
      } else if (typeof joined_members === 'string') {
        try {
          const parsed = JSON.parse(joined_members);
          joinedMembersJson = JSON.stringify(parsed);
        } catch (e) {
          joinedMembersJson = JSON.stringify([joined_members]);
        }
      } else {
        joinedMembersJson = JSON.stringify([joined_members]);
      }
      if (joinedMembersJson.length > 2000) {
        throw new Error('Joined members data exceeds maximum length of 2000 characters');
      }
    }

    const sql = `
      INSERT INTO tbl_events 
        (title, description, start_date, end_date, location, link, type, status, date_created, image, joined_members)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title.trim(),
      description.trim(),
      formattedStartDate,
      formattedEndDate,
      location.trim(),
      link ? link.trim() : null,
      type.trim(),
      status,
      formattedDateCreated,
      imageBlob,
      joinedMembersJson
    ];

    const [result] = await query(sql, params);
    const createdEvent = await getEventById(result.insertId);

    return {
      success: true,
      message: 'Event created successfully',
      data: createdEvent.data
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

async function getAllEvents(options = {}) {
  try {
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const type = options.type || null;
    const sortBy = options.sortBy || null;
    const dateRangeStart = options.dateRangeStart || null;
    const dateRangeEnd = options.dateRangeEnd || null;

    let countSql = 'SELECT COUNT(*) as total FROM tbl_events';
    let countParams = [];

    let sql = 'SELECT * FROM tbl_events';
    const params = [];

    const whereConditions = [];
    let hasWhere = false;

    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(title LIKE ? OR description LIKE ? OR location LIKE ? OR type LIKE ?)`;
      const searchPattern = `%${searchValue}%`;
      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    if (status && status !== 'All Statuses') {
      whereConditions.push('status = ?');
      countParams.push(status);
      params.push(status);
      hasWhere = true;
    }

    if (type && type !== 'All Types') {
      whereConditions.push('type = ?');
      countParams.push(type);
      params.push(type);
      hasWhere = true;
    }

    if (dateRangeStart && dateRangeEnd) {
      whereConditions.push('start_date >= ? AND start_date <= ?');
      countParams.push(dateRangeStart, dateRangeEnd);
      params.push(dateRangeStart, dateRangeEnd);
      hasWhere = true;
    } else if (dateRangeStart) {
      whereConditions.push('start_date >= ?');
      countParams.push(dateRangeStart);
      params.push(dateRangeStart);
      hasWhere = true;
    } else if (dateRangeEnd) {
      whereConditions.push('start_date <= ?');
      countParams.push(dateRangeEnd);
      params.push(dateRangeEnd);
      hasWhere = true;
    }

    // Add month filter for month-based sorting (as WHERE clause to actually filter)
    const monthMap = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    
    if (monthMap[sortBy] !== undefined) {
      whereConditions.push('MONTH(start_date) = ?');
      countParams.push(monthMap[sortBy]);
      params.push(monthMap[sortBy]);
      hasWhere = true;
    } else if (sortBy === 'This Month') {
      whereConditions.push('MONTH(start_date) = MONTH(CURDATE()) AND YEAR(start_date) = YEAR(CURDATE())');
      hasWhere = true;
    } else if (sortBy === 'Last Month') {
      whereConditions.push('MONTH(start_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(start_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
      hasWhere = true;
    } else if (sortBy === 'This Year') {
      whereConditions.push('YEAR(start_date) = YEAR(CURDATE())');
      hasWhere = true;
    } else if (sortBy === 'Last Year') {
      whereConditions.push('YEAR(start_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 YEAR))');
      hasWhere = true;
    }

    if (hasWhere) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }

    let orderByClause = ' ORDER BY ';
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Title (A-Z)':
        orderByClause += 'title ASC';
        break;
      case 'Title (Z-A)':
        orderByClause += 'title DESC';
        break;
      case 'Start Date (Newest)':
        orderByClause += 'start_date DESC';
        break;
      case 'Start Date (Oldest)':
        orderByClause += 'start_date ASC';
        break;
      case 'End Date (Newest)':
        orderByClause += 'end_date DESC';
        break;
      case 'End Date (Oldest)':
        orderByClause += 'end_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'date_created ASC';
        break;
      case 'Type (A-Z)':
        orderByClause += 'type ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'status ASC';
        break;
      case 'Status (Pending First)':
        orderByClause += `CASE status 
          WHEN 'pending' THEN 1 
          WHEN 'ongoing' THEN 2 
          WHEN 'completed' THEN 3 
          ELSE 4 
        END, date_created DESC`;
        break;
      default:
        orderByClause += 'date_created DESC';
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

    const processedRows = rows.map(event => {
      const processedEvent = { ...event };
      let imageUrl = null;
      if (event.image && Buffer.isBuffer(event.image)) {
        const base64String = convertBlobToBase64(event.image);
        if (base64String) {
          imageUrl = `data:image/jpeg;base64,${base64String}`;
        }
      }
      processedEvent.imageUrl = imageUrl;
      if (event.image && Buffer.isBuffer(event.image)) {
        processedEvent.image = convertBlobToBase64(event.image);
      } else {
        processedEvent.image = null;
      }
      
      if (event.joined_members) {
        try {
          processedEvent.joined_members = JSON.parse(event.joined_members);
        } catch (e) {
          console.warn('Failed to parse joined_members JSON for event_id:', event.event_id);
          processedEvent.joined_members = [];
        }
      } else {
        processedEvent.joined_members = [];
      }
      
      return processedEvent;
    });

    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null && finalLimit !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || processedRows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Events retrieved successfully',
      data: processedRows,
      count: processedRows.length,
      totalCount: totalCount,
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
    console.error('Error fetching events:', error);
    throw error;
  }
}

async function getEventById(eventId) {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    const sql = 'SELECT * FROM tbl_events WHERE event_id = ?';
    const [rows] = await query(sql, [eventId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Event not found',
        data: null
      };
    }

    const event = rows[0];
    let imageUrl = null;
    if (event.image && Buffer.isBuffer(event.image)) {
      const base64String = convertBlobToBase64(event.image);
      if (base64String) {
        imageUrl = `data:image/jpeg;base64,${base64String}`;
      }
    }
    event.imageUrl = imageUrl;
    if (event.image && Buffer.isBuffer(event.image)) {
      event.image = convertBlobToBase64(event.image);
    } else {
      event.image = null;
    }
    
    if (event.joined_members) {
      try {
        event.joined_members = JSON.parse(event.joined_members);
      } catch (e) {
        event.joined_members = [];
      }
    } else {
      event.joined_members = [];
    }

    return {
      success: true,
      message: 'Event retrieved successfully',
      data: event
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}

async function updateEvent(eventId, eventData) {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    const eventCheck = await getEventById(eventId);
    if (!eventCheck.success) {
      return {
        success: false,
        message: 'Event not found',
        data: null
      };
    }

    const {
      title,
      description,
      start_date,
      end_date,
      location,
      link,
      type,
      status,
      date_created,
      image,
      joined_members
    } = eventData;

    const fields = [];
    const params = [];

    if (title !== undefined) {
      if (title.trim().length > 45) {
        throw new Error('Title exceeds maximum length of 45 characters');
      }
      fields.push('title = ?');
      params.push(title.trim());
    }

    if (description !== undefined) {
      if (description.trim().length > 500) {
        throw new Error('Description exceeds maximum length of 500 characters');
      }
      fields.push('description = ?');
      params.push(description.trim());
    }

    if (start_date !== undefined) {
      const startDate = new Date(start_date);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start_date format');
      }
      const formattedStartDate = moment(start_date).format('YYYY-MM-DD HH:mm:ss');
      fields.push('start_date = ?');
      params.push(formattedStartDate);
    }

    if (end_date !== undefined) {
      const endDate = new Date(end_date);
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end_date format');
      }
      const formattedEndDate = moment(end_date).format('YYYY-MM-DD HH:mm:ss');
      fields.push('end_date = ?');
      params.push(formattedEndDate);
    }

    if (start_date !== undefined && end_date !== undefined) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (endDate < startDate) {
        throw new Error('end_date must be after or equal to start_date');
      }
    }

    if (location !== undefined) {
      if (location.trim().length > 45) {
        throw new Error('Location exceeds maximum length of 45 characters');
      }
      fields.push('location = ?');
      params.push(location.trim());
    }

    if (link !== undefined) {
      if (link === null || link === '') {
        fields.push('link = ?');
        params.push(null);
      } else {
        if (link.trim().length > 500) {
          throw new Error('Link exceeds maximum length of 500 characters');
        }
        fields.push('link = ?');
        params.push(link.trim());
      }
    }

    if (type !== undefined) {
      if (type.trim().length > 45) {
        throw new Error('Type exceeds maximum length of 45 characters');
      }
      fields.push('type = ?');
      params.push(type.trim());
    }

    if (status !== undefined) {
      if (status.trim().length > 45) {
        throw new Error('Status exceeds maximum length of 45 characters');
      }
      fields.push('status = ?');
      params.push(status);
    }

    if (date_created !== undefined) {
      const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');
      fields.push('date_created = ?');
      params.push(formattedDateCreated);
    }

    if (image !== undefined) {
      const imageBlob = convertImageToBlob(image);
      fields.push('image = ?');
      params.push(imageBlob);
    }

    if (joined_members !== undefined) {
      let joinedMembersJson = null;
      if (joined_members !== null) {
        if (Array.isArray(joined_members)) {
          joinedMembersJson = JSON.stringify(joined_members);
        } else if (typeof joined_members === 'string') {
          try {
            const parsed = JSON.parse(joined_members);
            joinedMembersJson = JSON.stringify(parsed);
          } catch (e) {
            joinedMembersJson = JSON.stringify([joined_members]);
          }
        } else {
          joinedMembersJson = JSON.stringify([joined_members]);
        }
        if (joinedMembersJson.length > 2000) {
          throw new Error('Joined members data exceeds maximum length of 2000 characters');
        }
      }
      fields.push('joined_members = ?');
      params.push(joinedMembersJson);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(eventId);

    const sql = `
      UPDATE tbl_events
      SET ${fields.join(', ')}
      WHERE event_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Event not found or no changes made',
        data: null
      };
    }

    const updatedEvent = await getEventById(eventId);

    return {
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent.data
    };
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

async function deleteEvent(eventId, archivedBy = null) {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    const eventCheck = await getEventById(eventId);
    if (!eventCheck.success) {
      return {
        success: false,
        message: 'Event not found',
        data: null
      };
    }

    await archiveBeforeDelete(
      'tbl_events',
      String(eventId),
      eventCheck.data,
      archivedBy
    );

    const sql = 'DELETE FROM tbl_events WHERE event_id = ?';
    const [result] = await query(sql, [eventId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Event not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Event archived and deleted successfully',
      data: { event_id: eventId }
    };
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

async function exportEventsToExcel(options = {}) {
  try {
    const exportOptions = { ...options };
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllEvents(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No events found to export');
    }

    const events = result.data;

    const excelData = events.map((event, index) => {
      return {
        'No.': index + 1,
        'Event ID': event.event_id || '',
        'Title': event.title || '',
        'Description': event.description || '',
        'Start Date': event.start_date ? moment(event.start_date).format('YYYY-MM-DD HH:mm:ss') : '',
        'End Date': event.end_date ? moment(event.end_date).format('YYYY-MM-DD HH:mm:ss') : '',
        'Location': event.location || '',
        'Link': event.link || '',
        'Type': event.type || '',
        'Status': event.status || '',
        'Date Created': event.date_created ? moment(event.date_created).format('YYYY-MM-DD HH:mm:ss') : '',
        'Created Date': event.date_created ? moment(event.date_created).format('YYYY-MM-DD') : ''
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 5 }, { wch: 12 }, { wch: 30 }, { wch: 40 },
      { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 30 },
      { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Events');

    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting events to Excel:', error);
    throw error;
  }
}

async function getEventsByMemberId(memberId, options = {}) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const type = options.type || null;
    const sortBy = options.sortBy || null;

    const memberIdNum = parseInt(memberId);

    let sql = 'SELECT * FROM tbl_events';
    const params = [];

    const whereConditions = [];
    let hasWhere = false;

    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(title LIKE ? OR description LIKE ? OR location LIKE ? OR type LIKE ?)`;
      const searchPattern = `%${searchValue}%`;
      whereConditions.push(searchCondition);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    if (status && status !== 'All Statuses') {
      whereConditions.push('status = ?');
      params.push(status);
      hasWhere = true;
    }

    if (type && type !== 'All Types') {
      whereConditions.push('type = ?');
      params.push(type);
      hasWhere = true;
    }

    if (hasWhere) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      sql += whereClause;
    }

    let orderByClause = ' ORDER BY ';
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Title (A-Z)':
        orderByClause += 'title ASC';
        break;
      case 'Title (Z-A)':
        orderByClause += 'title DESC';
        break;
      case 'Start Date (Newest)':
        orderByClause += 'start_date DESC';
        break;
      case 'Start Date (Oldest)':
        orderByClause += 'start_date ASC';
        break;
      case 'End Date (Newest)':
        orderByClause += 'end_date DESC';
        break;
      case 'End Date (Oldest)':
        orderByClause += 'end_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'date_created ASC';
        break;
      case 'Type (A-Z)':
        orderByClause += 'type ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'status ASC';
        break;
      case 'Status (Pending First)':
        orderByClause += `CASE status 
          WHEN 'pending' THEN 1 
          WHEN 'ongoing' THEN 2 
          WHEN 'completed' THEN 3 
          ELSE 4 
        END, date_created DESC`;
        break;
      default:
        orderByClause += 'date_created DESC';
    }
    sql += orderByClause;

    const [allRows] = await query(sql, params);

    const filteredRows = allRows.filter(event => {
      if (!event.joined_members || event.joined_members.trim() === '') {
        return false;
      }

      try {
        const joinedMembersArray = JSON.parse(event.joined_members);
        if (Array.isArray(joinedMembersArray)) {
          return joinedMembersArray.some(id => {
            const idNum = parseInt(id);
            return !isNaN(idNum) && idNum === memberIdNum;
          });
        }
        return false;
      } catch (e) {
        return false;
      }
    });

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

    let rows;
    if (finalLimit !== null) {
      const limitValue = Math.max(1, parseInt(finalLimit) || 10);
      const offsetValue = Math.max(0, parseInt(finalOffset) || 0);
      rows = filteredRows.slice(offsetValue, offsetValue + limitValue);
    } else {
      rows = filteredRows;
    }

    const processedRows = rows.map(event => {
      const processedEvent = { ...event };
      let imageUrl = null;
      if (event.image && Buffer.isBuffer(event.image)) {
        const base64String = convertBlobToBase64(event.image);
        if (base64String) {
          imageUrl = `data:image/jpeg;base64,${base64String}`;
        }
      }
      processedEvent.imageUrl = imageUrl;
      if (event.image && Buffer.isBuffer(event.image)) {
        processedEvent.image = convertBlobToBase64(event.image);
      } else {
        processedEvent.image = null;
      }
      
      if (event.joined_members) {
        try {
          processedEvent.joined_members = JSON.parse(event.joined_members);
        } catch (e) {
          processedEvent.joined_members = [];
        }
      } else {
        processedEvent.joined_members = [];
      }
      
      return processedEvent;
    });

    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null && finalLimit !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || processedRows.length;
    const totalFilteredCount = filteredRows.length;
    const totalPages = finalLimit ? Math.ceil(totalFilteredCount / finalLimit) : 1;
    const hasMore = currentPage < totalPages;

    return {
      success: true,
      message: 'Events retrieved successfully',
      data: processedRows,
      count: processedRows.length,
      pagination: {
        page: currentPage,
        pageSize: currentPageSize,
        totalPages: totalPages,
        hasNextPage: hasMore,
        hasPreviousPage: currentPage > 1
      }
    };
  } catch (error) {
    console.error('Error fetching events by member ID:', error);
    throw error;
  }
}

async function getSermonEvents() {
  try {
    const sql = `
      SELECT * FROM tbl_events
      WHERE status = ?
        AND link IS NOT NULL
        AND link != ''
        AND start_date <= NOW()
        AND end_date >= NOW()
      ORDER BY start_date DESC
    `;

    const params = ['ongoing'];

    const [rows] = await query(sql, params);

    const processedRows = rows.map(event => {
      const processedEvent = { ...event };
      let imageUrl = null;
      if (event.image && Buffer.isBuffer(event.image)) {
        const base64String = convertBlobToBase64(event.image);
        if (base64String) {
          imageUrl = `data:image/jpeg;base64,${base64String}`;
        }
      }
      processedEvent.imageUrl = imageUrl;
      if (event.image && Buffer.isBuffer(event.image)) {
        processedEvent.image = convertBlobToBase64(event.image);
      } else {
        processedEvent.image = null;
      }

      if (event.joined_members) {
        try {
          processedEvent.joined_members = JSON.parse(event.joined_members);
        } catch (e) {
          processedEvent.joined_members = [];
        }
      } else {
        processedEvent.joined_members = [];
      }

      return processedEvent;
    });

    return {
      success: true,
      message: 'Sermon events retrieved successfully',
      data: processedRows,
      count: processedRows.length
    };
  } catch (error) {
    console.error('Error fetching sermon events:', error);
    throw error;
  }
}

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  exportEventsToExcel,
  getEventsByMemberId,
  getSermonEvents
};
