const { Router } = require('express');

const {
  createCalendarValidators,
  updateCalendarValidators,
} = require('../validators/calendarValidators');
const validateRequest = require('../middleware/validateRequest');
const {
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
} = require('../controllers/calendarController');

const router = Router();

router.get('/', getCalendars);
router.post('/', createCalendarValidators, validateRequest, createCalendar);
router.put('/:id', updateCalendarValidators, validateRequest, updateCalendar);
router.delete('/:id', updateCalendarValidators.slice(0, 1), validateRequest, deleteCalendar);

module.exports = router;
