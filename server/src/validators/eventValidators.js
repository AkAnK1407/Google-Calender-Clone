const { body, param, query } = require('express-validator');

const recurrenceValidators = () => [
  body('recurrence.frequency')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurrence frequency'),
  body('recurrence.interval')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Recurrence interval must be between 1 and 365'),
  body('recurrence.count')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Recurrence count must be between 1 and 500'),
  body('recurrence.endDate')
    .optional()
    .isISO8601()
    .withMessage('Recurrence endDate must be a valid ISO date'),
  body('recurrence.byWeekDays')
    .optional()
    .isArray({ min: 1, max: 7 })
    .withMessage('byWeekDays must be an array'),
  body('recurrence.byWeekDays.*')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('byWeekDays values must be between 0 and 6'),
  body('recurrence.byMonthDay')
    .optional()
    .isArray({ min: 1, max: 31 })
    .withMessage('byMonthDay must be an array'),
  body('recurrence.byMonthDay.*')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('byMonthDay values must be between 1 and 31'),
];

const remindersValidators = () => [
  body('reminders')
    .optional()
    .isArray({ max: 5 })
    .withMessage('reminders must be an array with up to 5 entries'),
  body('reminders.*.method')
    .optional()
    .isIn(['email', 'popup', 'notification'])
    .withMessage('Invalid reminder method'),
  body('reminders.*.offsetMinutes')
    .optional()
    .isInt({ min: 0, max: 60 * 24 * 30 })
    .withMessage('Reminder offset must be between 0 and 43200 minutes'),
];

const attendeeValidators = () => [
  body('attendees')
    .optional()
    .isArray({ max: 50 })
    .withMessage('attendees must be an array with up to 50 people'),
  body('attendees.*.email')
    .optional()
    .isEmail()
    .withMessage('Attendee email must be valid'),
  body('attendees.*.responseStatus')
    .optional()
    .isIn(['accepted', 'declined', 'tentative', 'needsAction'])
    .withMessage('Invalid attendee response status'),
];

const baseEventValidators = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('description').optional().isString().isLength({ max: 5000 }).withMessage('Description too long'),
  body('startTime').isISO8601().withMessage('startTime must be a valid ISO date'),
  body('endTime').isISO8601().withMessage('endTime must be a valid ISO date'),
  body('calendar').notEmpty().withMessage('calendar is required'),
  body('isAllDay').optional().isBoolean().withMessage('isAllDay must be boolean'),
  body('color').optional().isString().isLength({ max: 20 }).withMessage('color must be a short hex string'),
  body('location').optional().isString().isLength({ max: 500 }).withMessage('location is too long'),
  body('userId').notEmpty().withMessage('userId is required'),
];

const createEventValidators = [
  ...baseEventValidators,
  ...recurrenceValidators(),
  ...remindersValidators(),
  ...attendeeValidators(),
];

const updateEventValidators = [
  param('id').isMongoId().withMessage('Invalid event id'),
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('calendar').optional(),
  body('isAllDay').optional().isBoolean(),
  body('color').optional().isString().isLength({ max: 20 }),
  body('location').optional().isString().isLength({ max: 500 }),
  body('userId').optional().notEmpty(),
  ...recurrenceValidators(),
  ...remindersValidators(),
  ...attendeeValidators(),
];

const getEventsValidators = [
  query('start').optional().isISO8601().withMessage('start must be a valid ISO date'),
  query('end').optional().isISO8601().withMessage('end must be a valid ISO date'),
  query('calendarId').optional().isMongoId().withMessage('calendarId must be a valid id'),
  query('calendarIds').optional().isString().withMessage('calendarIds must be comma separated ids'),
  query('search').optional().isString().isLength({ max: 200 }),
  query('includeRecurring').optional().toBoolean(),
  query('userId').optional().isString(),
];

const eventConflictValidators = [
  body('calendar').notEmpty().withMessage('calendar is required'),
  body('startTime').isISO8601().withMessage('startTime must be a valid ISO date'),
  body('endTime').isISO8601().withMessage('endTime must be a valid ISO date'),
  body('excludeEventId').optional().isMongoId().withMessage('excludeEventId must be a valid id'),
];

module.exports = {
  createEventValidators,
  updateEventValidators,
  getEventsValidators,
  eventConflictValidators,
};
