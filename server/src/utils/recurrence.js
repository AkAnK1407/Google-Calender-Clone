const { RRule, RRuleSet, Weekday } = require('rrule');

const FREQUENCY_MAP = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
};

const WEEKDAY_MAP = {
  0: RRule.SU,
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
};

const toDate = (value) => (value ? new Date(value) : null);

const eventOverlapsRange = (start, end, rangeStart, rangeEnd) => {
  return start <= rangeEnd && end >= rangeStart;
};

const buildRRule = (event) => {
  const recurrence = event.recurrence || {};
  if (!recurrence.frequency || recurrence.frequency === 'none') {
    return null;
  }

  const options = {
    freq: FREQUENCY_MAP[recurrence.frequency],
    interval: recurrence.interval || 1,
    dtstart: toDate(event.startTime),
  };

  if (recurrence.count) {
    options.count = recurrence.count;
  }

  if (recurrence.endDate) {
    options.until = toDate(recurrence.endDate);
  }

  if (Array.isArray(recurrence.byWeekDays) && recurrence.byWeekDays.length > 0) {
    options.byweekday = recurrence.byWeekDays
      .map((day) => WEEKDAY_MAP[day])
      .filter((weekday) => weekday instanceof Weekday);
  }

  if (Array.isArray(recurrence.byMonthDay) && recurrence.byMonthDay.length > 0) {
    options.bymonthday = recurrence.byMonthDay;
  }

  return new RRule(options);
};

const expandRecurringEvent = (event, rangeStart, rangeEnd) => {
  const baseStart = toDate(event.startTime);
  const baseEnd = toDate(event.endTime);
  const duration = baseEnd.getTime() - baseStart.getTime();

  const baseEvent = {
    ...event,
    startTime: baseStart,
    endTime: baseEnd,
    isInstance: false,
  };

  const rule = buildRRule(event);

  if (!rule) {
    if (!eventOverlapsRange(baseStart, baseEnd, rangeStart, rangeEnd)) {
      return [];
    }
    return [baseEvent];
  }

  const ruleSet = new RRuleSet();
  ruleSet.rrule(rule);

  const occurrences = ruleSet.between(rangeStart, rangeEnd, true);

  return occurrences.map((occurrence) => ({
    ...event,
    startTime: occurrence,
    endTime: new Date(occurrence.getTime() + duration),
    isInstance: true,
    masterEventId: event._id?.toString?.() || event.masterEventId || event.id,
    occurrenceId: `${event._id?.toString?.() || event.masterEventId || event.id}_${occurrence.getTime()}`,
  }));
};

const expandEventCollection = (events, rangeStart, rangeEnd) => {
  const safeStart = toDate(rangeStart) || new Date('1970-01-01T00:00:00.000Z');
  const safeEnd = toDate(rangeEnd) || new Date('2100-01-01T00:00:00.000Z');

  return events.flatMap((event) => expandRecurringEvent(event, safeStart, safeEnd));
};

module.exports = {
  expandRecurringEvent,
  expandEventCollection,
  eventOverlapsRange,
};
