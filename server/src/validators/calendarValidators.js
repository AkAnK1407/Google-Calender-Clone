const { body, param } = require('express-validator');

const createCalendarValidators = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  body('color').optional().isString().isLength({ max: 20 }).withMessage('Color must be a short hex string'),
  body('visibility').optional().isIn(['public', 'private']).withMessage('Visibility must be public or private'),
  body('userId').notEmpty().withMessage('userId is required'),
  body('isPrimary').optional().isBoolean(),
  body('timeZone').optional().isString().isLength({ max: 100 }),
];

const updateCalendarValidators = [
  param('id').isMongoId().withMessage('Invalid calendar id'),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('color').optional().isString().isLength({ max: 20 }),
  body('visibility').optional().isIn(['public', 'private']),
  body('userId').optional().notEmpty(),
  body('isPrimary').optional().isBoolean(),
  body('timeZone').optional().isString().isLength({ max: 100 }),
];

module.exports = {
  createCalendarValidators,
  updateCalendarValidators,
};
