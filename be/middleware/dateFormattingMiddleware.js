const moment = require('moment');

/**
 * Middleware to ensure date fields are properly formatted in API responses
 * This prevents timezone conversion issues when dates are displayed in the frontend
 */
const dateFormattingMiddleware = (req, res, next) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override res.json to format date fields
  res.json = function(data) {
    // Format date fields in the response data
    const formattedData = formatDatesInResponse(data);
    return originalJson.call(this, formattedData);
  };
  
  next();
};

/**
 * Recursively format date fields in response data
 * @param {any} data - The response data to format
 * @returns {any} - The formatted data
 */
function formatDatesInResponse(data) {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => formatDatesInResponse(item));
  }
  
  if (typeof data === 'object') {
    const formatted = {};
    for (const [key, value] of Object.entries(data)) {
      if (isDateField(key)) {
        formatted[key] = formatDateValue(value);
      } else if (typeof value === 'object' && value !== null) {
        formatted[key] = formatDatesInResponse(value);
      } else {
        formatted[key] = value;
      }
    }
    return formatted;
  }
  
  return data;
}

/**
 * Check if a field name is a date field
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - True if it's a date field
 */
function isDateField(fieldName) {
  const dateFieldPatterns = [
    'date_of_birth',
    'date_created',
    'date_completed',
    'preferred_dedication_date',
    'marriage_date',
    'service_date',
    'date_death',
    'baptism_date',
    'deceased_birthdate'
  ];
  
  return dateFieldPatterns.some(pattern => fieldName.toLowerCase().includes(pattern));
}

/**
 * Format a date value to ensure consistent YYYY-MM-DD format
 * @param {any} value - The date value to format
 * @returns {string|null} - The formatted date or null
 */
function formatDateValue(value) {
  if (!value) {
    return value;
  }
  
  // Check if this is a service_date field (datetime field)
  // This function doesn't have access to the field name, so we need to detect datetime values
  if (typeof value === 'string') {
    // Check if it's already a properly formatted datetime (YYYY-MM-DD HH:mm:ss)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      return value; // Return as-is for datetime fields
    }
    // Check if it's a date only (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value; // Return as-is for date fields
    }
  }
  
  // Try to parse and format the date/datetime
  try {
    const date = moment(value);
    if (date.isValid()) {
      // Check if the original value contained time information
      const originalString = String(value);
      if (originalString.includes(':') || originalString.includes('T')) {
        // Format as datetime
        return date.format('YYYY-MM-DD HH:mm:ss');
      } else {
        // Format as date only
        return date.format('YYYY-MM-DD');
      }
    }
  } catch (error) {
    // If parsing fails, return the original value
    console.warn('Failed to format date value:', value, error);
  }
  
  return value;
}

module.exports = dateFormattingMiddleware;