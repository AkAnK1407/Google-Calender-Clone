import { useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import EventCard from '../../Event/EventCard';
import {
  generateWeekDays,
  isEventSpanningDate,
} from '../../../utils/date';

const MIN_EVENT_HEIGHT = 4; // percent

const minutesFromMidnight = (date) => date.getHours() * 60 + date.getMinutes();

const getDurationMinutes = (event) => {
  const diff = event.endTime - event.startTime;
  return Math.max(diff / 60000, 15);
};

const layoutDayEvents = (events) => {
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  const columns = [];

  return sorted.map((event) => {
    let columnIndex = columns.findIndex((col) => col[col.length - 1] <= event.startTime);
    if (columnIndex === -1) {
      columnIndex = columns.length;
      columns.push([]);
    }

    columns[columnIndex].push(event.endTime);

    return {
      event,
      columnIndex,
      totalColumns: columns.length,
    };
  });
};

const WeekView = ({ selectedDate, events, onEventClick, onCreateEvent }) => {
  const days = useMemo(() => generateWeekDays(selectedDate), [selectedDate]);

  const eventsByDay = useMemo(() => {
    return days.map((day) => {
      const start = startOfDay(day);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const dayEvents = events.filter((event) =>
        event.startTime < end && event.endTime > start && !event.isAllDay
      );

      const allDay = events.filter((event) => event.isAllDay && isEventSpanningDate(event, day));

      return {
        day,
        timedEvents: layoutDayEvents(dayEvents),
        allDayEvents: allDay,
      };
    });
  }, [days, events]);

  const handleAllDayDoubleClick = (day) => {
    const start = startOfDay(day);
    const end = endOfDay(day);
    onCreateEvent?.({
      startTime: start,
      endTime: end,
      isAllDay: true,
    });
  };

  const handleTimedDoubleClick = (day, event) => {
    if (!onCreateEvent) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - bounds.top;
    const ratio = Math.max(0, Math.min(offsetY / bounds.height, 1));
    const totalMinutes = Math.round(ratio * 24 * 60);
    const limitedMinutes = Math.max(0, Math.min(totalMinutes, 24 * 60 - 30));
    const snappedMinutes = Math.floor(limitedMinutes / 30) * 30;

    const start = startOfDay(day);
    start.setMinutes(snappedMinutes);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    onCreateEvent({
      startTime: start,
      endTime: end,
      isAllDay: false,
    });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-16 shrink-0 border-r border-google-gray bg-white text-right text-xs text-slate-500">
        {Array.from({ length: 24 }).map((_, index) => (
          <div key={index} className="h-16 border-b border-dashed border-google-gray/60 pr-2">
            {index > 0 && (
              <span className="-mt-2 block">
                {format(new Date(new Date().setHours(index, 0, 0, 0)), 'ha')}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="grid h-full min-w-[700px] grid-cols-7">
          {eventsByDay.map(({ day, timedEvents, allDayEvents }) => {
            const dayKey = startOfDay(day).toISOString();

            return (
              <div key={dayKey} className="flex flex-col border-r border-google-gray">
                <div className="border-b border-google-gray bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                  <span className="block text-xs uppercase text-slate-400">{format(day, 'EEE')}</span>
                  <span className="text-lg text-slate-700">{format(day, 'd')}</span>
                </div>
                <Droppable droppableId={`${dayKey}-all-day`} direction="vertical" type="event">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onDoubleClick={() => handleAllDayDoubleClick(day)}
                      className="min-h-[3.5rem] border-b border-google-gray bg-slate-50 px-2 py-2"
                    >
                      {allDayEvents.map((event, index) => {
                        const baseId = event.occurrenceId || event._id || `all-day-${index}`;
                        const draggableId = `all-day-${baseId}`;
                        return (
                          <Draggable key={draggableId} draggableId={draggableId} index={index}>
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className="mb-1"
                              >
                                <EventCard event={event} onClick={onEventClick} />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <Droppable droppableId={dayKey} type="event">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onDoubleClick={(event) => handleTimedDoubleClick(day, event)}
                      className="relative flex-1 bg-white"
                    >
                      <div className="absolute inset-0">
                        {Array.from({ length: 24 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-16 border-b border-dashed border-google-gray/60"
                          />
                        ))}
                      </div>
                      <div className="relative z-10 h-full">
                        {timedEvents.map(({ event, columnIndex, totalColumns }, index) => {
                          const draggableId = event.occurrenceId || event._id;
                          const startMinutes = minutesFromMidnight(event.startTime);
                          const duration = getDurationMinutes(event);
                          const top = (startMinutes / (24 * 60)) * 100;
                          const height = Math.max((duration / (24 * 60)) * 100, MIN_EVENT_HEIGHT);
                          const width = 100 / totalColumns;
                          const left = columnIndex * width;

                          return (
                            <Draggable key={draggableId} draggableId={draggableId} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className="absolute cursor-pointer"
                                  style={{
                                    top: `${top}%`,
                                    height: `${height}%`,
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    zIndex: dragSnapshot.isDragging ? 30 : 20,
                                  }}
                                >
                                  <EventCard event={event} onClick={onEventClick} isDragging={dragSnapshot.isDragging} />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
