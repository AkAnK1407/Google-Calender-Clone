import {
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachMinuteOfInterval,
  differenceInMinutes,
  format,
  isSameDay,
  isToday,
  isSameMonth,
  isWithinInterval,
} from 'date-fns';

export const VIEW_TYPES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
};

export const getViewRange = (view, referenceDate, options = {}) => {
  const startOfWeekOptions = { weekStartsOn: options.weekStartsOn ?? 0 };

  switch (view) {
    case VIEW_TYPES.WEEK:
      return {
        start: startOfWeek(referenceDate, startOfWeekOptions),
        end: endOfWeek(referenceDate, startOfWeekOptions),
      };
    case VIEW_TYPES.DAY:
      return {
        start: startOfDay(referenceDate),
        end: endOfDay(referenceDate),
      };
    case VIEW_TYPES.MONTH:
    default: {
      const monthStart = startOfMonth(referenceDate);
      const firstGridDay = startOfWeek(monthStart, startOfWeekOptions);
      const monthEnd = endOfMonth(referenceDate);
      const lastGridDay = endOfWeek(monthEnd, startOfWeekOptions);
      return {
        start: firstGridDay,
        end: lastGridDay,
      };
    }
  }
};

export const generateMonthMatrix = (referenceDate, options = {}) => {
  const { weekStartsOn = 0 } = options;
  const { start, end } = getViewRange(VIEW_TYPES.MONTH, referenceDate, { weekStartsOn });

  const days = [];
  let current = start;

  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
};

export const generateWeekDays = (referenceDate, options = {}) => {
  const { weekStartsOn = 0 } = options;
  const weekStart = startOfWeek(referenceDate, { weekStartsOn });
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
};

export const generateDayHours = (intervalMinutes = 60) => {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  return eachMinuteOfInterval({ start, end }, { step: intervalMinutes });
};

export const formatEventTime = (startTime, endTime, isAllDay) => {
  if (isAllDay) {
    return 'All day';
  }
  return `${format(startTime, 'p')} ? ${format(endTime, 'p')}`;
};

export const isEventMultiDay = (event) => {
  return !isSameDay(event.startTime, event.endTime);
};

export const isEventSpanningDate = (event, date) => {
  return isWithinInterval(date, { start: startOfDay(event.startTime), end: endOfDay(event.endTime) });
};

export const getEventDurationInMinutes = (event) => {
  return differenceInMinutes(event.endTime, event.startTime);
};

export const getNextViewDate = (view, referenceDate, direction = 1) => {
  switch (view) {
    case VIEW_TYPES.WEEK:
      return addWeeks(referenceDate, direction);
    case VIEW_TYPES.DAY:
      return addDays(referenceDate, direction);
    case VIEW_TYPES.MONTH:
    default:
      return addMonths(referenceDate, direction);
  }
};

export const moveDateByView = (view, referenceDate, offset) => {
  return getNextViewDate(view, referenceDate, offset);
};

export const getKeyboardShortcutLabel = (key) => {
  const labels = {
    ArrowLeft: 'Go to previous period',
    ArrowRight: 'Go to next period',
    ArrowUp: 'Move up',
    ArrowDown: 'Move down',
    KeyT: 'Jump to today',
    KeyM: 'Switch to Month view',
    KeyW: 'Switch to Week view',
    KeyD: 'Switch to Day view',
    KeyC: 'Create event',
  };

  return labels[key] || '';
};

export const isDateInMonth = (date, referenceDate) => {
  return isSameMonth(date, referenceDate);
};

export const isDateToday = (date) => isToday(date);

export const isSameCalendarDay = (dateA, dateB) => isSameDay(dateA, dateB);

export const clampDateToRange = (date, start, end) => {
  if (date < start) return start;
  if (date > end) return end;
  return date;
};

export const getCurrentTimeIndicatorPosition = () => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const percentage = (minutes / (24 * 60)) * 100;
  return Math.min(Math.max(percentage, 0), 100);
};

export const formatDateForApi = (date) => date.toISOString();

export const getDefaultRangeForView = (view, date) => {
  const { start, end } = getViewRange(view, date);
  return {
    start: formatDateForApi(start),
    end: formatDateForApi(end),
  };
};

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const formatRangeLabel = (view, date) => {
  switch (view) {
    case VIEW_TYPES.DAY:
      return format(date, 'EEEE, MMM d, yyyy');
    case VIEW_TYPES.WEEK: {
      const { start, end } = getViewRange(view, date);
      return `${format(start, 'MMM d')} ? ${format(end, 'MMM d, yyyy')}`;
    }
    case VIEW_TYPES.MONTH:
    default:
      return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
  }
};
