import { memo } from 'react';
import { format } from 'date-fns';

import useCalendarStore from '../../store/calendarStore';
import {
  generateMonthMatrix,
  isDateInMonth,
  isDateToday,
  isSameCalendarDay,
  MONTH_LABELS,
} from '../../utils/date';

const MiniCalendar = () => {
  const { selectedDate, setSelectedDate } = useCalendarStore((state) => ({
    selectedDate: state.selectedDate,
    setSelectedDate: state.setSelectedDate,
  }));

  const weeks = generateMonthMatrix(selectedDate);

  return (
    <div className="rounded-2xl border border-google-gray bg-white p-4 shadow-google">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-600">
        <span>{MONTH_LABELS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</span>
        <span>{format(selectedDate, 'EEEE')}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-1 space-y-1 text-sm">
        {weeks.map((week, index) => (
          <div key={index} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const inMonth = isDateInMonth(day, selectedDate);
              const isToday = isDateToday(day);
              const isSelected = isSameCalendarDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`rounded-full py-1 text-center transition ${
                    isSelected
                      ? 'bg-google-blue font-semibold text-white shadow-google'
                      : isToday
                        ? 'border border-google-blue font-semibold text-google-blue'
                        : inMonth
                          ? 'text-slate-700 hover:bg-google-hover'
                          : 'text-slate-400'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(MiniCalendar);
