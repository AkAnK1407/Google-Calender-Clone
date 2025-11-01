import { memo } from 'react';
import { Check } from 'lucide-react';

import useCalendarStore from '../../store/calendarStore';

const CalendarList = () => {
  const {
    calendars,
    activeCalendarIds,
    setActiveCalendars,
  } = useCalendarStore((state) => ({
    calendars: state.calendars,
    activeCalendarIds: state.activeCalendarIds,
    setActiveCalendars: state.setActiveCalendars,
  }));

  const handleToggle = (calendarId) => {
    if (activeCalendarIds.includes(calendarId)) {
      setActiveCalendars(activeCalendarIds.filter((id) => id !== calendarId));
    } else {
      setActiveCalendars([...activeCalendarIds, calendarId]);
    }
  };

  return (
    <div className="rounded-2xl border border-google-gray bg-white p-4 shadow-google">
      <h2 className="mb-3 text-sm font-semibold text-slate-600">My Calendars</h2>
      <div className="space-y-2">
        {calendars.map((calendar) => {
          const isActive = activeCalendarIds.includes(calendar._id);
          return (
            <button
              key={calendar._id}
              onClick={() => handleToggle(calendar._id)}
              className={`flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left transition ${
                isActive ? 'bg-google-hover' : 'hover:bg-google-hover'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: calendar.color }}
                />
                <span className="text-sm font-medium text-slate-700">{calendar.name}</span>
              </span>
              {isActive && <Check className="h-4 w-4 text-google-blue" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(CalendarList);
