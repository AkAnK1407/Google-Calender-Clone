import { useCallback, useEffect, useMemo } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { AnimatePresence, motion } from 'framer-motion';

import useCalendarStore from '../../store/calendarStore';
import { VIEW_TYPES } from '../../utils/date';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import CalendarHeader from './CalendarHeader';
import CalendarSidebar from './CalendarSidebar';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';
import EventModal from './modals/EventModal';

const DEFAULT_USER_ID = process.env.REACT_APP_DEFAULT_USER_ID || 'demo-user';

const Calendar = () => {
  const {
    events,
    currentView,
    selectedDate,
    loadEvents,
    loadCalendars,
    updateEvent,
    openEventModal,
    isLoadingEvents,
    calendars,
    activeCalendarIds,
  } = useCalendarStore((state) => ({
    events: state.events,
    currentView: state.currentView,
    selectedDate: state.selectedDate,
    loadEvents: state.loadEvents,
    loadCalendars: state.loadCalendars,
    updateEvent: state.updateEvent,
    openEventModal: state.openEventModal,
    isLoadingEvents: state.isLoadingEvents,
    calendars: state.calendars,
    activeCalendarIds: state.activeCalendarIds,
  }));

  useKeyboardShortcuts();

  useEffect(() => {
    loadCalendars(DEFAULT_USER_ID);
  }, [loadCalendars]);

  useEffect(() => {
    if (calendars.length) {
      loadEvents();
    }
  }, [currentView, selectedDate, calendars, activeCalendarIds, loadEvents]);

  const handleEventClick = (event) => {
    openEventModal('edit', event);
  };

  const handleCreateEvent = useCallback(
    (context = {}) => {
      openEventModal('create', null, context);
    },
    [openEventModal]
  );

  const findEventByDraggableId = (draggableId) => {
    const normalized = draggableId
      .replace(/^all-day-/, '')
      .replace(/^day-all-/, '');

    return events.find((event) => {
      const id = event.occurrenceId || event._id;
      return id === normalized || event._id === normalized;
    });
  };

  const handleDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const targetEvent = findEventByDraggableId(draggableId);
    if (!targetEvent) return;

    const droppableId = destination.droppableId.replace('-all-day', '');
    const dropDate = new Date(droppableId);
    if (Number.isNaN(dropDate.getTime())) return;

    const durationMs = targetEvent.endTime - targetEvent.startTime;
    const isAllDayDrop = destination.droppableId.includes('-all-day') || targetEvent.isAllDay;

    const newStart = new Date(dropDate);
    const newEnd = new Date(dropDate.getTime() + durationMs);

    if (!isAllDayDrop) {
      newStart.setHours(targetEvent.startTime.getHours(), targetEvent.startTime.getMinutes());
      newEnd.setHours(targetEvent.endTime.getHours(), targetEvent.endTime.getMinutes());
    }

    await updateEvent(targetEvent._id, {
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      isAllDay: isAllDayDrop,
    });

    await loadEvents();
  };

  const renderedView = useMemo(() => {
    const viewProps = {
      selectedDate,
      events,
      onEventClick: handleEventClick,
      onCreateEvent: handleCreateEvent,
    };

    switch (currentView) {
      case VIEW_TYPES.WEEK:
        return <WeekView {...viewProps} />;
      case VIEW_TYPES.DAY:
        return <DayView {...viewProps} />;
      case VIEW_TYPES.MONTH:
      default:
        return <MonthView {...viewProps} />;
    }
  }, [currentView, events, selectedDate, handleCreateEvent]);

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <CalendarHeader />
      <div className="flex flex-1 overflow-hidden">
        <CalendarSidebar />
        <div className="flex-1 overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col"
              >
                {isLoadingEvents ? (
                  <div className="flex flex-1 items-center justify-center text-slate-500">
                    Loading events...
                  </div>
                ) : (
                  renderedView
                )}
              </motion.div>
            </AnimatePresence>
          </DragDropContext>
        </div>
      </div>
      <EventModal />
    </div>
  );
};

export default Calendar;
