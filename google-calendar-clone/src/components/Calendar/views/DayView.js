import { useMemo } from 'react';
import { format, startOfDay } from 'date-fns';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import EventCard from '../../Event/EventCard';
import {
  isEventSpanningDate,
} from '../../../utils/date';

const MIN_EVENT_HEIGHT = 6;

const minutesFromMidnight = (date) => date.getHours() * 60 + date.getMinutes();

const getDurationMinutes = (event) => {
  const diff = event.endTime - event.startTime;
  return Math.max(diff / 60000, 15);
};

const DayView = ({ selectedDate, events, onEventClick }) => {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay = events.filter((event) => event.isAllDay && isEventSpanningDate(event, selectedDate));
    const timed = events
      .filter((event) => !event.isAllDay && event.startTime < dayEnd && event.endTime > dayStart)
      .sort((a, b) => a.startTime - b.startTime);

    return {
      allDayEvents: allDay,
      timedEvents: timed,
    };
  }, [events, selectedDate, dayEnd, dayStart]);

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
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="border-b border-google-gray bg-white px-4 py-3 text-lg font-semibold text-slate-700">
            <span className="block text-sm uppercase text-slate-400">{format(selectedDate, 'EEEE')}</span>
            {format(selectedDate, 'MMMM d, yyyy')}
          </div>
          <Droppable droppableId={`${dayStart.toISOString()}-all-day`} direction="vertical" type="event">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-h-[3.5rem] border-b border-google-gray bg-slate-50 px-4 py-3"
              >
                {allDayEvents.map((event, index) => {
                  const baseId = event.occurrenceId || event._id || `day-all-${index}`;
                  const draggableId = `day-all-${baseId}`;
                  return (
                    <Draggable key={draggableId} draggableId={draggableId} index={index}>
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className="mb-2"
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
          <Droppable droppableId={dayStart.toISOString()} type="event">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
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
                  {timedEvents.map((event, index) => {
                    const draggableId = event.occurrenceId || event._id || `event-${index}`;
                    const startMinutes = minutesFromMidnight(event.startTime);
                    const duration = getDurationMinutes(event);
                    const top = (startMinutes / (24 * 60)) * 100;
                    const height = Math.max((duration / (24 * 60)) * 100, MIN_EVENT_HEIGHT);

                    return (
                      <Draggable key={draggableId} draggableId={draggableId} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="absolute left-2 right-2 cursor-pointer"
                            style={{
                              top: `${top}%`,
                              height: `${height}%`,
                              zIndex: dragSnapshot.isDragging ? 30 : 10,
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
      </div>
    </div>
  );
};

export default DayView;
