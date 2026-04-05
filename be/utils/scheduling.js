const moment = require('moment-timezone');

const DEFAULT_TIMEZONE = 'Asia/Manila';
const SLOT_INTERVAL_MINUTES = 30;

const TIME_RANGES = {
  ALL_DAY: { start: '08:00', end: '20:00' }, // Mon-Fri any time
  MORNING_NOON: { start: '08:00', end: '12:00' }, // Custom 8AM-12PM Range
  SALVATION_TALK: { start: '08:00', end: '12:00' },
  NOON_ONLY: { times: ['12:00'] },
};

const BIBLE_STUDY_CAPACITY = 999; // Effectively unlimited for now

function normalizeServiceType(rawServiceType) {
  const value = String(rawServiceType || '').trim().toLowerCase();
  if (!value || value === 'salvation' || value === 'salvation_talk' || value === 'salvation-talk') {
    return 'salvation';
  }
  if (
    value === 'bible study' ||
    value === 'bible_study' ||
    value === 'biblestudy' ||
    value === 'bible-study'
  ) {
    return 'bible_study';
  }
  if (
    value === 'water baptism' ||
    value === 'water_baptism' ||
    value === 'water-baptism' ||
    value === 'baptism'
  ) {
    return 'water_baptism';
  }
  return null;
}

function parseDateOnly(dateStr, timezone = DEFAULT_TIMEZONE) {
  const parsed = moment.tz(String(dateStr || ''), 'YYYY-MM-DD', true, timezone);
  if (!parsed.isValid()) return null;
  return parsed.startOf('day');
}

function parseDateTime(dateTimeStr, timezone = DEFAULT_TIMEZONE) {
  const parsed = moment.tz(String(dateTimeStr || ''), ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], timezone);
  if (!parsed.isValid()) return null;
  return parsed;
}

function getAllowedTimeRanges(serviceType, dayOfWeek) {
  // All services are now managed manually via tbl_service_slots by the admin.
  // We return an empty array to disable the automatic legacy candidate slot generation.
  return [];
}

function isWithinRange(slotMoment, range) {
  if (range.times && Array.isArray(range.times)) {
    return range.times.some((t) => slotMoment.format('HH:mm') === t);
  }

  const start = moment.tz(slotMoment.format('YYYY-MM-DD') + ' ' + range.start, 'YYYY-MM-DD HH:mm', true, slotMoment.tz());
  const end = moment.tz(slotMoment.format('YYYY-MM-DD') + ' ' + range.end, 'YYYY-MM-DD HH:mm', true, slotMoment.tz());

  // Compare using minutes precision. We treat slot as a start time that must be within [start, end].
  return slotMoment.isSameOrAfter(start, 'minute') && slotMoment.isSameOrBefore(end, 'minute');
}

function getSlotIntervalMinutes(serviceType) {
  return SLOT_INTERVAL_MINUTES; // Manual slots handle their own intervals; default to 30 for display
}

function generateCandidateSlotsForDate({ serviceType, dateStr, timezone = DEFAULT_TIMEZONE, now = null }) {
  const normalizedService = normalizeServiceType(serviceType);
  if (!normalizedService) {
    return { success: false, message: 'Invalid service type', data: [] };
  }

  const date = parseDateOnly(dateStr, timezone);
  if (!date) {
    return { success: false, message: 'Invalid date format. Use YYYY-MM-DD.', data: [] };
  }

  const effectiveNow = now || moment().tz(timezone);
  const day = date.day();
  const ranges = getAllowedTimeRanges(normalizedService, day);

  const slots = [];
  const intervalMinutes = getSlotIntervalMinutes(normalizedService);

  for (const range of ranges) {
    if (range.times) {
      for (const t of range.times) {
        const slot = moment.tz(`${date.format('YYYY-MM-DD')} ${t}`, 'YYYY-MM-DD HH:mm', true, timezone).seconds(0);
        if (slot.isValid()) slots.push(slot);
      }
      continue;
    }

    const start = moment.tz(`${date.format('YYYY-MM-DD')} ${range.start}`, 'YYYY-MM-DD HH:mm', true, timezone).seconds(0);
    const end = moment.tz(`${date.format('YYYY-MM-DD')} ${range.end}`, 'YYYY-MM-DD HH:mm', true, timezone).seconds(0);
    if (!start.isValid() || !end.isValid()) continue;

    const cursor = start.clone();
    while (cursor.isSameOrBefore(end)) {
      slots.push(cursor.clone());
      cursor.add(intervalMinutes, 'minutes');
    }
  }

  // De-duplicate and sort.
  const unique = new Map();
  for (const slot of slots) {
    unique.set(slot.format('YYYY-MM-DD HH:mm:ss'), slot);
  }

  const sorted = Array.from(unique.values()).sort((a, b) => a.valueOf() - b.valueOf());

  // Filter out slots for today and the past (Tomorrow onwards only).
  const filtered = sorted.filter((slot) => {
    return slot.isAfter(effectiveNow, 'day');
  });

  return {
    success: true,
    data: filtered.map((slot) => ({
      datetime: slot.format('YYYY-MM-DD HH:mm:ss'),
      time: slot.format('HH:mm'),
    })),
    meta: {
      timezone,
      serviceType: normalizedService,
      date: date.format('YYYY-MM-DD'),
      intervalMinutes: intervalMinutes,
    },
  };
}

function validateSelectedSlot({ serviceType, scheduledDateTimeStr, timezone = DEFAULT_TIMEZONE, now = null }) {
  const normalizedService = normalizeServiceType(serviceType);
  if (!normalizedService) {
    return { valid: false, message: 'Invalid service type.' };
  }

  const slot = parseDateTime(scheduledDateTimeStr, timezone);
  if (!slot) {
    return { valid: false, message: 'Invalid scheduled date/time. Use YYYY-MM-DD HH:mm:ss.' };
  }

  const effectiveNow = now || moment().tz(timezone);
  
  // All services require tomorrow onwards.
  if (slot.isSameOrBefore(effectiveNow, 'day')) {
    return { valid: false, message: 'Same-day scheduling is not allowed. Please select a date starting from tomorrow to allow for preparation.' };
  }
  
  // Universal rule: Cannot schedule in the past
  if (slot.isBefore(effectiveNow)) {
    return { valid: false, message: 'Selecting a past date or time is not allowed. Please choose a future slot.' };
  }

  if (slot.seconds() !== 0) {
    return { valid: false, message: 'Invalid time slot. Please select an exact time slot.' };
  }

  // Salvation, Bible Study, and Water Baptism are now managed manually via tbl_service_slots by the admin.
  // We bypass the automatic candidate/range checks.
  if (normalizedService === 'salvation' || normalizedService === 'bible_study' || normalizedService === 'water_baptism') {
    return { valid: true, serviceType: normalizedService, slot };
  }

  const intervalMinutes = getSlotIntervalMinutes(normalizedService);
  
  // For intervals > 60 minutes (like Bible Study 90min), simple modulo on slot.minutes() fails.
  // Instead, generate candidate slots for the date and check if the selected slot is one of them.
  const candidates = generateCandidateSlotsForDate({ 
    serviceType: normalizedService, 
    dateStr: slot.format('YYYY-MM-DD'), 
    timezone,
    now: effectiveNow.clone().subtract(1, 'year') // Allow checking older slots if needed for validation
  });

  const slotStr = slot.format('YYYY-MM-DD HH:mm:ss');
  const isValidCandidate = candidates.data.some(c => c.datetime === slotStr);

  if (!isValidCandidate) {
    return { valid: false, message: `Invalid time slot. Please select a valid ${intervalMinutes}-minute interval slot starting from the available range.` };
  }

  const ranges = getAllowedTimeRanges(normalizedService, slot.day());
  if (ranges.length === 0) {
    return { valid: false, message: 'No schedules are available for the selected date.' };
  }

  const allowed = ranges.some((range) => isWithinRange(slot, range));
  if (!allowed) {
    return { valid: false, message: 'Selected slot is not available based on Bible Study schedule rules.' };
  }

  return { valid: true, serviceType: normalizedService, slot };
}

module.exports = {
  DEFAULT_TIMEZONE,
  BIBLE_STUDY_CAPACITY,
  normalizeServiceType,
  generateCandidateSlotsForDate,
  validateSelectedSlot,
};

