import { memo } from 'react';
import { formatEventTime, isEventMultiDay } from '../../utils/date';

const EventCard = ({ event, onClick, isDragging, className = '' }) => {
  if (!event) return null;

  const { title, startTime, endTime, isAllDay, color } = event;
  const multiDay = isEventMultiDay(event);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      className={`group cursor-pointer rounded-md border border-transparent bg-white px-2 py-1 text-sm shadow-google transition-shadow hover:shadow-googleHover ${isDragging ? 'opacity-80' : ''} ${className}`}
      style={{ borderLeft: `4px solid ${color || '#1a73e8'}` }}
    >
      <p className="truncate font-medium text-slate-800">{title}</p>
      {!isAllDay && (
        <span className="text-xs text-slate-500">
          {formatEventTime(startTime, endTime, isAllDay)}
        </span>
      )}
      {multiDay && (
        <span className="mt-1 block text-xs uppercase tracking-wide text-google-blue">
          Multi-day event
        </span>
      )}
    </div>
  );
};

export default memo(EventCard);
