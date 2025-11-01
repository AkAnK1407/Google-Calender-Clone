const Calendar = require('../models/Calendar');
const Event = require('../models/Event');

const DEFAULT_CALENDARS = [
  {
    key: 'primary',
    name: 'My Calendar',
    color: '#1a73e8',
    isPrimary: true,
    visibility: 'private',
    timeZone: 'UTC',
  },
  {
    key: 'team',
    name: 'Team Sync',
    color: '#34a853',
    visibility: 'private',
    timeZone: 'UTC',
  },
  {
    key: 'reminders',
    name: 'Reminders',
    color: '#fbbc05',
    visibility: 'private',
    timeZone: 'UTC',
  },
];

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const buildDate = (base, dayOffset, hour = 0, minute = 0) => {
  const date = startOfDay(base);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

const createDefaultEvents = (calendarMap, userId) => {
  const base = new Date();
  const primary = calendarMap.primary;
  const team = calendarMap.team || primary;
  const reminders = calendarMap.reminders || primary;

  const events = [];

  if (primary) {
    const morningStandupStart = buildDate(base, 1, 9);
    events.push({
      title: 'Daily Planning',
      description: 'Outline top priorities for the day and review open tasks.',
      startTime: morningStandupStart,
      endTime: addMinutes(morningStandupStart, 45),
      calendar: primary._id,
      userId,
      color: primary.color,
      attendees: [],
      reminders: [{ method: 'popup', offsetMinutes: 10 }],
      recurrence: {
        frequency: 'daily',
        interval: 1,
        byWeekDays: [1, 2, 3, 4, 5],
      },
    });

    const focusBlockStart = buildDate(base, 2, 13, 0);
    events.push({
      title: 'Focus time: Deep work',
      description: 'Heads-down work block. Silence notifications and stay in the zone.',
      startTime: focusBlockStart,
      endTime: addMinutes(focusBlockStart, 120),
      calendar: primary._id,
      userId,
      color: '#4285f4',
      attendees: [],
      reminders: [{ method: 'popup', offsetMinutes: 5 }],
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        byWeekDays: [2, 4],
      },
    });
  }

  if (team) {
    const teamSyncStart = buildDate(base, 3, 11, 0);
    events.push({
      title: 'Weekly team sync',
      description: 'Roundtable update and dependency check-in with the core team.',
      startTime: teamSyncStart,
      endTime: addMinutes(teamSyncStart, 60),
      calendar: team._id,
      userId,
      color: team.color,
      attendees: [
        { email: 'pm@example.com', responseStatus: 'accepted' },
        { email: 'designer@example.com', responseStatus: 'accepted' },
      ],
      reminders: [
        { method: 'popup', offsetMinutes: 30 },
        { method: 'email', offsetMinutes: 60 },
      ],
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        byWeekDays: [3],
      },
    });

    const retroStart = buildDate(base, -3, 16, 0);
    events.push({
      title: 'Sprint retrospective',
      description: 'Celebrate wins, surface blockers, and capture concrete follow-ups.',
      startTime: retroStart,
      endTime: addMinutes(retroStart, 90),
      calendar: team._id,
      userId,
      color: '#46bdc6',
      attendees: [
        { email: 'engineer@example.com', responseStatus: 'tentative' },
      ],
      reminders: [{ method: 'popup', offsetMinutes: 15 }],
      recurrence: {
        frequency: 'weekly',
        interval: 2,
        byWeekDays: [5],
      },
    });
  }

  if (reminders) {
    const allDay = startOfDay(base);
    events.push({
      title: 'Send status update',
      description: 'Share the latest progress report with stakeholders.',
      startTime: allDay,
      endTime: addMinutes(allDay, 60 * 24 - 1),
      calendar: reminders._id,
      userId,
      color: reminders.color,
      isAllDay: true,
      attendees: [],
      reminders: [{ method: 'popup', offsetMinutes: 120 }],
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        byWeekDays: [4],
      },
    });
  }

  return events;
};

const ensureDemoUserData = async (userId) => {
  if (!userId) {
    return [];
  }

  const existingCalendars = await Calendar.find({ userId }).sort({ isPrimary: -1, createdAt: 1 }).lean();

  if (existingCalendars.length > 0) {
    return existingCalendars;
  }

  const calendarsToCreate = DEFAULT_CALENDARS.map((calendar) => ({
    ...calendar,
    userId,
  }));

  let createdCalendars = [];

  try {
    createdCalendars = await Calendar.insertMany(calendarsToCreate, { ordered: true });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate insert triggered by race condition; fall through to fetch.
    } else {
      throw error;
    }
  }

  const calendars = createdCalendars.length
    ? createdCalendars.map((calendar) => calendar.toObject())
    : await Calendar.find({ userId }).lean();

  const calendarMap = calendars.reduce((acc, calendar) => {
    const definition = DEFAULT_CALENDARS.find((item) => item.name === calendar.name);
    if (definition?.key) {
      acc[definition.key] = calendar;
    }
    return acc;
  }, {});

  const demoEvents = createDefaultEvents(calendarMap, userId);

  if (demoEvents.length) {
    try {
      await Event.insertMany(demoEvents, { ordered: false });
    } catch (error) {
      if (error.code !== 11000) {
        console.error('Unable to create demo events:', error);
      }
    }
  }

  return Calendar.find({ userId }).sort({ isPrimary: -1, createdAt: 1 }).lean();
};

module.exports = {
  ensureDemoUserData,
};

