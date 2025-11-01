const { Schema, model } = require('mongoose');

const calendarSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    color: {
      type: String,
      default: '#1a73e8',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    timeZone: {
      type: String,
      default: 'UTC',
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

calendarSchema.index({ userId: 1, name: 1 }, { unique: true });

const Calendar = model('Calendar', calendarSchema);

module.exports = Calendar;
