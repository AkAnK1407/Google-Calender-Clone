const { Router } = require('express');

const {
  createEventValidators,
  updateEventValidators,
  getEventsValidators,
  eventConflictValidators,
} = require('../validators/eventValidators');
const validateRequest = require('../middleware/validateRequest');
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventConflicts,
} = require('../controllers/eventController');

const router = Router();

router.get('/', getEventsValidators, validateRequest, getEvents);
router.post('/', createEventValidators, validateRequest, createEvent);
router.put('/:id', updateEventValidators, validateRequest, updateEvent);
router.delete('/:id', updateEventValidators.slice(0, 1), validateRequest, deleteEvent);
router.post('/conflicts', eventConflictValidators, validateRequest, getEventConflicts);

module.exports = router;
