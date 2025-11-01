const { Schema, model } = require('mongoose');

const reminderSchema = new Schema(
  {
    method: {
      type: String,
      enum: ['email', 'popup', 'notification'],
      default: 'popup',
    },
    offsetMinutes: {
      type: Number,
      min: 0,
      max: 60 * 24 * 14,
      default: 30,
    },
  },
  { _id: false }
);

const attendeeSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    name: String,
    responseStatus: {
      type: String,
      enum: ['accepted', 'declined', 'tentative', 'needsAction'],
      default: 'needsAction',
    },
  },
  { _id: false }
);

const recurrenceSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none',
    },
    interval: {
      type: Number,
      default: 1,
      min: 1,
      max: 365,
    },
    count: {
      type: Number,
      min: 1,
    },
    endDate: Date,
    byWeekDays: {
      type: [Number],
      validate: {
        validator: (value) => value == null || value.every((day) => day >= 0 && day <= 6),
        message: 'Week days must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
    byMonthDay: {
      type: [Number],
      validate: {
        validator: (value) => value == null || value.every((day) => day >= 1 && day <= 31),
        message: 'Month days must be between 1 and 31',
      },
    },
  },
  { _id: false }
);

const eventSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return this.isAllDay || value > this.startTime;
        },
        message: 'endTime must be greater than startTime',
      },
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    color: {
      type: String,
      default: '#1a73e8',
    },
    attendees: {
      type: [attendeeSchema],
      default: [],
    },
    calendar: {
      type: Schema.Types.ObjectId,
      ref: 'Calendar',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    recurrence: {
      type: recurrenceSchema,
      default: () => ({ frequency: 'none', interval: 1 }),
    },
    reminders: {
      type: [reminderSchema],
      default: [{ method: 'popup', offsetMinutes: 30 }],
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

eventSchema.index({ calendar: 1, startTime: 1, endTime: 1 });
eventSchema.index({ userId: 1, startTime: 1 });

const Event = model('Event', eventSchema);

module.exports = Event;
