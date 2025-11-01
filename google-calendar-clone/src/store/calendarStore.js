import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';

import {
  fetchEvents,
  fetchCalendars,
  createEvent as createEventApi,
  updateEvent as updateEventApi,
  deleteEvent as deleteEventApi,
  checkEventConflicts,
} from '../services/calendarApi';
import { VIEW_TYPES, getDefaultRangeForView } from '../utils/date';

const defaultModalState = {
  isOpen: false,
  mode: 'create',
  event: null,
  dateContext: null,
};

const normalizeEvent = (event) => ({
  ...event,
  startTime: new Date(event.startTime),
  endTime: new Date(event.endTime),
});

const useCalendarStore = create(
  devtools((set, get) => ({
    events: [],
    calendars: [],
    selectedDate: new Date(),
    currentView: VIEW_TYPES.MONTH,
    isLoadingEvents: false,
    isLoadingCalendars: false,
    error: null,
    searchTerm: '',
    activeCalendarIds: [],
    eventModal: defaultModalState,
    metadata: null,

    setCurrentView: (view) => set({ currentView: view }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setActiveCalendars: (ids) => set({ activeCalendarIds: ids }),
    setError: (error) => set({ error }),

    openEventModal: (mode = 'create', event = null, dateContext = null) => {
      set({
        eventModal: {
          isOpen: true,
          mode,
          event,
          dateContext,
        },
      });
    },

    closeEventModal: () => set({ eventModal: defaultModalState }),

    loadCalendars: async (userId) => {
      set({ isLoadingCalendars: true, error: null });

      try {
        const { calendars } = await fetchCalendars({ userId });
        const sorted = calendars.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

        set({
          calendars: sorted,
          isLoadingCalendars: false,
          activeCalendarIds: sorted.map((calendar) => calendar._id),
        });
      } catch (error) {
        console.error(error);
        set({ isLoadingCalendars: false, error: error.message });
        toast.error('Failed to load calendars');
      }
    },

    loadEvents: async (options = {}) => {
      const { selectedDate, currentView, searchTerm, activeCalendarIds } = get();

      set({ isLoadingEvents: true, error: null });

      try {
        const range = getDefaultRangeForView(currentView, selectedDate);

        const params = {
          ...range,
          includeRecurring: true,
          search: searchTerm || undefined,
          calendarIds: activeCalendarIds.join(','),
          ...options,
        };

        const data = await fetchEvents(params);
        const normalizedEvents = (data.events || []).map(normalizeEvent);

        set({
          events: normalizedEvents,
          metadata: data.metadata,
          isLoadingEvents: false,
        });
      } catch (error) {
        console.error(error);
        set({ isLoadingEvents: false, error: error.message });
        toast.error('Failed to load events');
      }
    },

    createEvent: async (payload) => {
      try {
        const { event } = await createEventApi(payload);
        set((state) => ({
          events: [...state.events, normalizeEvent(event)],
        }));
        toast.success('Event created');
        return event;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to create event');
        throw error;
      }
    },

    updateEvent: async (id, payload) => {
      try {
        const { event } = await updateEventApi(id, payload);
        set((state) => ({
          events: state.events.map((item) =>
            item._id === event._id ? normalizeEvent(event) : item
          ),
        }));
        toast.success('Event updated');
        return event;
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to update event');
        throw error;
      }
    },

    deleteEvent: async (id) => {
      try {
        await deleteEventApi(id);
        set((state) => ({
          events: state.events.filter((event) => event._id !== id),
        }));
        toast.success('Event deleted');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to delete event');
        throw error;
      }
    },

    checkConflicts: async (payload) => {
      try {
        const { conflicts } = await checkEventConflicts(payload);
        return conflicts;
      } catch (error) {
        console.error(error);
        toast.error('Could not check conflicts');
        return [];
      }
    },
  }))
);

export default useCalendarStore;
