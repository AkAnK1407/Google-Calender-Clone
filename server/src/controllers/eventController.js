const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const asyncHandler = require('../utils/asyncHandler');
const { expandEventCollection } = require('../utils/recurrence');
const { findConflictingEvents } = require('../utils/conflict');

const buildCalendarFilter = ({ calendarId, calendarIds }) => {
  if (calendarId) {
    return [calendarId];
  }

  if (calendarIds) {
    return calendarIds.split(',').map((id) => id.trim()).filter(Boolean);
  }

  return null;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const sanitizeEventPayload = (payload) => {
  const allowedFields = [
    'title',
    'description',
    'startTime',
    'endTime',
    'isAllDay',
    'location',
    'color',
    'attendees',
    'recurrence',
    'reminders',
    'calendar',
    'userId',
    'metadata',
  ];

  return allowedFields.reduce((acc, field) => {
    if (payload[field] !== undefined) {
      acc[field] = payload[field];
    }
    return acc;
  }, {});
};

const ensureCalendarExists = async (calendarId, userId) => {
  const calendar = await Calendar.findOne({ _id: calendarId, userId });
  if (!calendar) {
    const error = new Error('Calendar not found for user');
    error.status = 404;
    throw error;
  }
  return calendar;
};

const getEvents = asyncHandler(async (req, res) => {
  const {
    start,
    end,
    calendarId,
    calendarIds,
    search,
    includeRecurring = 'true',
    userId,
  } = req.query;

  const calendars = buildCalendarFilter({ calendarId, calendarIds });
  const rangeStart = parseDate(start);
  const rangeEnd = parseDate(end);

  const matchConditions = [];

  if (calendars && calendars.length > 0) {
    matchConditions.push({ calendar: { $in: calendars } });
  }

  if (userId) {
    matchConditions.push({ userId });
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    matchConditions.push({
      $or: [
        { title: regex },
        { description: regex },
        { location: regex },
      ],
    });
  }

  if (rangeStart && rangeEnd) {
    matchConditions.push({
      $or: [
        {
          startTime: { $lte: rangeEnd },
          endTime: { $gte: rangeStart },
        },
        { 'recurrence.frequency': { $ne: 'none' } },
      ],
    });
  }

  const query = matchConditions.length > 0 ? { $and: matchConditions } : {};

  const events = await Event.find(query).lean({ getters: true, virtuals: true });

  const shouldExpand = includeRecurring !== 'false' && includeRecurring !== false;
  const now = new Date();
  const defaultRangeStart = rangeStart || new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const defaultRangeEnd = rangeEnd || new Date(now.getFullYear(), now.getMonth() + 6, 0, 23, 59, 59);

  const expandedEvents = shouldExpand
    ? expandEventCollection(events, defaultRangeStart, defaultRangeEnd)
    : events;

  const sorted = expandedEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  res.json({
    status: 200,
    metadata: {
      total: sorted.length,
      rangeStart: defaultRangeStart,
      rangeEnd: defaultRangeEnd,
    },
    events: sorted,
  });
});

const createEvent = asyncHandler(async (req, res) => {
  const payload = sanitizeEventPayload(req.body);

  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);

  if (!payload.isAllDay && endTime <= startTime) {
    return res.status(400).json({
      status: 400,
      message: 'endTime must be greater than startTime',
    });
  }

  await ensureCalendarExists(payload.calendar, payload.userId);

  const conflicts = await findConflictingEvents({
    calendar: payload.calendar,
    startTime,
    endTime,
  });

  if (conflicts.length > 0) {
    return res.status(409).json({
      status: 409,
      message: 'Event conflicts with existing events',
      conflicts,
    });
  }

  const event = await Event.create(payload);

  res.status(201).json({
    status: 201,
    event,
  });
});

const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = sanitizeEventPayload(req.body);

  const event = await Event.findById(id);

  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Event not found',
    });
  }

  const nextEvent = { ...event.toObject(), ...updates };

  if (updates.calendar || updates.userId) {
    await ensureCalendarExists(nextEvent.calendar, nextEvent.userId);
  }

  const startTime = updates.startTime ? new Date(updates.startTime) : event.startTime;
  const endTime = updates.endTime ? new Date(updates.endTime) : event.endTime;

  if (!nextEvent.isAllDay && endTime <= startTime) {
    return res.status(400).json({
      status: 400,
      message: 'endTime must be greater than startTime',
    });
  }

  const conflicts = await findConflictingEvents({
    calendar: nextEvent.calendar,
    startTime,
    endTime,
    excludeEventId: id,
  });

  if (conflicts.length > 0) {
    return res.status(409).json({
      status: 409,
      message: 'Event conflicts with existing events',
      conflicts,
    });
  }

  Object.assign(event, updates);
  await event.save();

  res.json({
    status: 200,
    event,
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id);

  if (!event) {
    return res.status(404).json({
      status: 404,
      message: 'Event not found',
    });
  }

  await event.deleteOne();

  res.status(204).send();
});

const getEventConflicts = asyncHandler(async (req, res) => {
  const { calendar, startTime, endTime, excludeEventId } = req.body;

  if (!calendar || !startTime || !endTime) {
    return res.status(400).json({
      status: 400,
      message: 'calendar, startTime, and endTime are required',
    });
  }

  const conflicts = await findConflictingEvents({
    calendar,
    startTime,
    endTime,
    excludeEventId,
  });

  res.json({
    status: 200,
    conflicts,
  });
});

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventConflicts,
};
