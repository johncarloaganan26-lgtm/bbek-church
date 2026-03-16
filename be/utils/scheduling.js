const moment = require('moment-timezone');

const DEFAULT_TIMEZONE = 'Asia/Manila';
const SLOT_INTERVAL_MINUTES = 30;

const TIME_RANGES = {
  ALL_DAY: { start: '08:00', end: '20:00' }, // Mon-Fri any time
  MORNING_NOON: { start: '08:00', end: '17:00' }, // No evening (starts at 5 PM or 6 PM)
  NOON_ONLY: { times: ['12:00'] },
};

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
  // dayOfWeek: 0=Sun .. 6=Sat (moment().day())
  if (serviceType === 'salvation') {
    if (dayOfWeek === 0) return [TIME_RANGES.NOON_ONLY]; // Sunday: Noon only
    if (dayOfWeek === 3) return [TIME_RANGES.MORNING_NOON]; // Wednesday: No evening
    if (dayOfWeek === 6) return [TIME_RANGES.MORNING_NOON]; // Saturday: Morning and Noon, No evening
    return [TIME_RANGES.ALL_DAY]; // Mon, Tue, Thu, Fri: Any time
  }

  if (serviceType === 'bible_study') {
    if (dayOfWeek === 3) return [TIME_RANGES.MORNING_NOON]; // Wednesday: No evening
    if (dayOfWeek === 6) return [TIME_RANGES.MORNING_NOON]; // Saturday: No evening
    return []; // Bible Study is ONLY Wed/Sat
  }

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
      cursor.add(SLOT_INTERVAL_MINUTES, 'minutes');
    }
  }

  // De-duplicate and sort.
  const unique = new Map();
  for (const slot of slots) {
    unique.set(slot.format('YYYY-MM-DD HH:mm:ss'), slot);
  }

  const sorted = Array.from(unique.values()).sort((a, b) => a.valueOf() - b.valueOf());

  // Filter out past slots if same day.
  const filtered = sorted.filter((slot) => slot.isSameOrAfter(effectiveNow, 'minute'));

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
      intervalMinutes: SLOT_INTERVAL_MINUTES,
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
  if (slot.isBefore(effectiveNow, 'minute')) {
    return { valid: false, message: 'Cannot schedule in the past. Please select a future time slot.' };
  }

  if (slot.seconds() !== 0) {
    return { valid: false, message: 'Invalid time slot. Please select an exact time slot.' };
  }

  if (slot.minutes() % SLOT_INTERVAL_MINUTES !== 0) {
    return { valid: false, message: `Invalid time slot. Please select a ${SLOT_INTERVAL_MINUTES}-minute interval time.` };
  }

  const ranges = getAllowedTimeRanges(normalizedService, slot.day());
  if (ranges.length === 0) {
    return { valid: false, message: 'No schedules are available for the selected date.' };
  }

  const allowed = ranges.some((range) => isWithinRange(slot, range));
  if (!allowed) {
    if (normalizedService === 'salvation') {
      return { valid: false, message: 'Selected slot is not available based on Salvation Talk schedule rules.' };
    }
    return { valid: false, message: 'Selected slot is not available based on Bible Study schedule rules.' };
  }

  return { valid: true, serviceType: normalizedService, slot };
}

module.exports = {
  DEFAULT_TIMEZONE,
  normalizeServiceType,
  generateCandidateSlotsForDate,
  validateSelectedSlot,
};

