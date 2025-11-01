import { useMemo } from 'react';
import { format, startOfDay, addDays } from 'date-fns';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';

import EventCard from '../../Event/EventCard';
import {
  generateMonthMatrix,
  isDateInMonth,
  isDateToday,
  isEventSpanningDate,
} from '../../../utils/date';

const groupEventsByDay = (events) => {
  const map = new Map();

  events.forEach((event) => {
    const start = startOfDay(event.startTime);
    const end = startOfDay(event.endTime);

    let current = start;
    while (current <= end) {
      const key = current.toISOString();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(event);
      current = addDays(current, 1);
    }
  });

  return map;
};

const MonthView = ({ selectedDate, events, onEventClick }) => {
  const weeks = useMemo(() => generateMonthMatrix(selectedDate), [selectedDate]);

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-l border-google-gray bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((label) => (
          <div key={label} className="border-r border-google-gray px-3 py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="flex-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid min-h-[10rem] grid-cols-7 border-b border-l border-google-gray">
            {week.map((day) => {
              const isoKey = startOfDay(day).toISOString();
              const dayEvents = eventsByDay.get(isoKey) || [];
              const inMonth = isDateInMonth(day, selectedDate);
              const isToday = isDateToday(day);

              return (
                <Droppable droppableId={isoKey} key={isoKey} type="event">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col border-r border-google-gray p-2 transition ${
                        snapshot.isDraggingOver ? 'bg-google-hover/70' : 'bg-white'
                      } ${inMonth ? '' : 'bg-slate-100'} ${isToday ? 'ring-2 ring-google-blue' : ''}`}
                    >
                      <div className="mb-1 flex items-center justify-between text-xs font-medium">
                        <span className={inMonth ? 'text-slate-700' : 'text-slate-400'}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {dayEvents.map((event, index) => {
                            const draggableId = event.occurrenceId || event._id;
                            const continuing = isEventSpanningDate(event, day) && event.startTime < day;

                            return (
                              <Draggable key={draggableId} draggableId={draggableId} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                  <motion.div
                                    layout
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                  >
                                    <EventCard
                                      event={event}
                                      onClick={onEventClick}
                                      isDragging={dragSnapshot.isDragging}
                                      className={continuing ? 'border-l-[6px]' : ''}
                                    />
                                  </motion.div>
                                )}
                              </Draggable>
                            );
                          })}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;
