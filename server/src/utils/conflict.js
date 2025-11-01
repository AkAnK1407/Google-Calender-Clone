const Event = require('../models/Event');
const { expandEventCollection, eventOverlapsRange } = require('./recurrence');

const normalizeCalendars = (calendar) => {
  if (!calendar) {
    return [];
  }
  if (Array.isArray(calendar)) {
    return calendar;
  }
  return [calendar];
};

const findConflictingEvents = async ({
  calendar,
  startTime,
  endTime,
  excludeEventId,
}) => {
  const calendars = normalizeCalendars(calendar);
  const rangeStart = new Date(startTime);
  const rangeEnd = new Date(endTime);

  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    throw new Error('Invalid date range for conflict detection');
  }

  if (calendars.length === 0) {
    return [];
  }

  const query = {
    calendar: { $in: calendars },
    ...(excludeEventId && { _id: { $ne: excludeEventId } }),
    $or: [
      {
        startTime: { $lte: rangeEnd },
        endTime: { $gte: rangeStart },
      },
      { 'recurrence.frequency': { $ne: 'none' } },
    ],
  };

  const existingEvents = await Event.find(query).lean();

  if (existingEvents.length === 0) {
    return [];
  }

  const occurrences = expandEventCollection(existingEvents, rangeStart, rangeEnd);

  return occurrences.filter((occurrence) =>
    eventOverlapsRange(
      new Date(occurrence.startTime),
      new Date(occurrence.endTime),
      rangeStart,
      rangeEnd
    )
  );
};

module.exports = {
  findConflictingEvents,
};
