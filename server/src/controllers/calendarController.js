const Calendar = require('../models/Calendar');
const asyncHandler = require('../utils/asyncHandler');

const sanitizeCalendarPayload = (payload) => {
  const allowedFields = ['name', 'color', 'visibility', 'userId', 'isPrimary', 'timeZone', 'metadata'];
  return allowedFields.reduce((acc, field) => {
    if (payload[field] !== undefined) {
      acc[field] = payload[field];
    }
    return acc;
  }, {});
};

const getCalendars = asyncHandler(async (req, res) => {
  const { userId, visibility } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  if (visibility) filter.visibility = visibility;

  const calendars = await Calendar.find(filter).sort({ isPrimary: -1, createdAt: 1 });

  res.json({
    status: 200,
    calendars,
  });
});

const createCalendar = asyncHandler(async (req, res) => {
  const payload = sanitizeCalendarPayload(req.body);

  const existing = await Calendar.findOne({ userId: payload.userId, name: payload.name });
  if (existing) {
    return res.status(409).json({
      status: 409,
      message: 'A calendar with this name already exists for the user',
    });
  }

  if (payload.isPrimary) {
    await Calendar.updateMany({ userId: payload.userId, isPrimary: true }, { isPrimary: false });
  }

  const calendar = await Calendar.create(payload);

  res.status(201).json({
    status: 201,
    calendar,
  });
});

const updateCalendar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = sanitizeCalendarPayload(req.body);

  const calendar = await Calendar.findById(id);

  if (!calendar) {
    return res.status(404).json({
      status: 404,
      message: 'Calendar not found',
    });
  }

  if (updates.name && updates.name !== calendar.name) {
    const duplicate = await Calendar.findOne({ userId: calendar.userId, name: updates.name });
    if (duplicate) {
      return res.status(409).json({
        status: 409,
        message: 'A calendar with this name already exists for the user',
      });
    }
  }

  if (updates.isPrimary) {
    await Calendar.updateMany({ userId: calendar.userId, _id: { $ne: id }, isPrimary: true }, { isPrimary: false });
  }

  Object.assign(calendar, updates);
  await calendar.save();

  res.json({
    status: 200,
    calendar,
  });
});

const deleteCalendar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const calendar = await Calendar.findById(id);

  if (!calendar) {
    return res.status(404).json({
      status: 404,
      message: 'Calendar not found',
    });
  }

  if (calendar.isPrimary) {
    return res.status(400).json({
      status: 400,
      message: 'Primary calendar cannot be deleted',
    });
  }

  await calendar.deleteOne();

  res.status(204).send();
});

module.exports = {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
};
