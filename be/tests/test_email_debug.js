const moment = require('moment');

// Test with the exact format from database
const baptismDate = '2026-02-13 22:08:00';

console.log('=== Debug Test ===');
console.log('Input baptismDate:', baptismDate);

// The fixed logic
const date = new Date(baptismDate);
console.log('Date object:', date);
console.log('Date.getTime():', date.getTime());
console.log('isNaN:', isNaN(date.getTime()));

if (!isNaN(date.getTime())) {
  const hasTime = baptismDate.includes(':') && 
    (baptismDate.match(/\d{2}:\d{2}:\d{2}/) || baptismDate.match(/\d{2}:\d{2}/));
  
  console.log('hasTime:', hasTime);
  
  // Format date only
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  console.log('formattedDate (no time):', formattedDate);
  
  // Format with time (using toLocaleString)
  const result = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  console.log('result (with time):', result);
}
