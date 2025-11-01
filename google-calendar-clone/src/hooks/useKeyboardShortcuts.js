import { useEffect } from 'react';

import useCalendarStore from '../store/calendarStore';
import { VIEW_TYPES, moveDateByView } from '../utils/date';

const isTypingTarget = (target) => {
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  const editable = target.isContentEditable;
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    editable
  );
};

const useKeyboardShortcuts = () => {
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

  useEffect(() => {
    const handler = (event) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setSelectedDate(moveDateByView(currentView, selectedDate, -1));
          break;
        case 'ArrowRight':
          event.preventDefault();
          setSelectedDate(moveDateByView(currentView, selectedDate, 1));
          break;
        case 'KeyT':
          event.preventDefault();
          setSelectedDate(new Date());
          break;
        case 'KeyM':
          event.preventDefault();
          setCurrentView(VIEW_TYPES.MONTH);
          break;
        case 'KeyW':
          event.preventDefault();
          setCurrentView(VIEW_TYPES.WEEK);
          break;
        case 'KeyD':
          event.preventDefault();
          setCurrentView(VIEW_TYPES.DAY);
          break;
        case 'KeyC':
          event.preventDefault();
          openEventModal('create');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentView, selectedDate, setSelectedDate, setCurrentView, openEventModal]);
};

export default useKeyboardShortcuts;
