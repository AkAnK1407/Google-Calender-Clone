import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import useCalendarStore from '../../store/calendarStore';
import MiniCalendar from '../Sidebar/MiniCalendar';
import CalendarList from '../Sidebar/CalendarList';

const CalendarSidebar = () => {
  const { setSearchTerm, loadEvents } = useCalendarStore((state) => ({
    setSearchTerm: state.setSearchTerm,
    loadEvents: state.loadEvents,
  }));
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchValue);
      loadEvents({ search: searchValue });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchValue, setSearchTerm, loadEvents]);

  return (
    <aside className="w-80 shrink-0 space-y-6 bg-slate-100 p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search events"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className="w-full rounded-full border border-google-gray bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
        />
      </div>
      <MiniCalendar />
      <CalendarList />
    </aside>
  );
};

export default CalendarSidebar;
