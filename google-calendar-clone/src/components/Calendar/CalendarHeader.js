import { memo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import useCalendarStore from '../../store/calendarStore';
import {
  VIEW_TYPES,
  formatRangeLabel,
  moveDateByView,
} from '../../utils/date';

const views = [
  { id: VIEW_TYPES.MONTH, label: 'Month' },
  { id: VIEW_TYPES.WEEK, label: 'Week' },
  { id: VIEW_TYPES.DAY, label: 'Day' },
];

const CalendarHeader = () => {
  const {
    currentView,
    setCurrentView,
    selectedDate,
    setSelectedDate,
    openEventModal,
  } = useCalendarStore((state) => ({
    currentView: state.currentView,
    setCurrentView: state.setCurrentView,
    selectedDate: state.selectedDate,
    setSelectedDate: state.setSelectedDate,
    openEventModal: state.openEventModal,
  }));

  const handleNavigate = (direction) => {
    setSelectedDate(moveDateByView(currentView, selectedDate, direction));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="flex items-center justify-between border-b border-google-gray bg-white px-6 py-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openEventModal('create')}
          className="flex items-center gap-2 rounded-full bg-google-blue px-4 py-2 font-medium text-white shadow-google transition hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
        <div className="ml-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-full border border-google-gray px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-google-hover"
          >
            Today
          </button>
          <div className="flex items-center rounded-full border border-google-gray">
            <button
              type="button"
              onClick={() => handleNavigate(-1)}
              className="rounded-l-full p-2 hover:bg-google-hover"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(1)}
              className="rounded-r-full p-2 hover:bg-google-hover"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
        <h1 className="ml-4 text-2xl font-semibold text-slate-900">
          {formatRangeLabel(currentView, selectedDate)}
        </h1>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-google-gray bg-slate-50 px-1 py-1">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setCurrentView(view.id)}
            className={`rounded-full px-4 py-1 text-sm font-medium transition ${
              currentView === view.id
                ? 'bg-white text-slate-900 shadow-google'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default memo(CalendarHeader);
