import { useEffect, useMemo, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Users, MapPin, Bell, Repeat } from 'lucide-react';
import { formatISO, parseISO } from 'date-fns';

import useCalendarStore from '../../../store/calendarStore';

const GOOGLE_COLORS = ['#1a73e8', '#ea4335', '#34a853', '#fbbc05', '#9a67ea', '#4285f4', '#46bdc6', '#f4511e'];

const defaultReminder = { method: 'popup', offsetMinutes: 30 };

const initialRecurrence = {
  frequency: 'none',
  interval: 1,
  endDate: '',
  count: '',
  byWeekDays: [],
  byMonthDay: [],
};

const toDateInputValue = (date) => (date ? formatISO(date, { representation: 'date' }) : '');
const toTimeInputValue = (date) => (date ? formatISO(date, { representation: 'time' }).slice(0, 5) : '');

const buildDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;
  const isoString = timeValue ? `${dateValue}T${timeValue}` : `${dateValue}T00:00`;
  return new Date(isoString);
};

const EventModal = () => {
  const {
    eventModal,
    closeEventModal,
    createEvent,
    updateEvent,
    deleteEvent,
    calendars,
    checkConflicts,
    loadEvents,
  } = useCalendarStore((state) => ({
    eventModal: state.eventModal,
    closeEventModal: state.closeEventModal,
    createEvent: state.createEvent,
    updateEvent: state.updateEvent,
    deleteEvent: state.deleteEvent,
    calendars: state.calendars,
    checkConflicts: state.checkConflicts,
    loadEvents: state.loadEvents,
  }));

  const isOpen = eventModal.isOpen;
  const isEditMode = eventModal.mode === 'edit';

  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    calendar: calendars[0]?._id,
    color: GOOGLE_COLORS[0],
    isAllDay: false,
    startDate: toDateInputValue(new Date()),
    startTime: '09:00',
    endDate: toDateInputValue(new Date()),
    endTime: '10:00',
    location: '',
    attendees: [''],
    reminders: [defaultReminder],
    recurrence: initialRecurrence,
  });
  const [conflicts, setConflicts] = useState([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  useEffect(() => {
    if (isOpen && eventModal.event) {
      const event = eventModal.event;
      const start = event.startTime instanceof Date ? event.startTime : parseISO(event.startTime);
      const end = event.endTime instanceof Date ? event.endTime : parseISO(event.endTime);

      setFormValues({
        title: event.title || '',
        description: event.description || '',
        calendar: event.calendar?._id || event.calendar,
        color: event.color || GOOGLE_COLORS[0],
        isAllDay: event.isAllDay || false,
        startDate: toDateInputValue(start),
        startTime: toTimeInputValue(start),
        endDate: toDateInputValue(end),
        endTime: toTimeInputValue(end),
        location: event.location || '',
        attendees: event.attendees?.length ? event.attendees.map((attendee) => attendee.email || '') : [''],
        reminders: event.reminders?.length ? event.reminders : [defaultReminder],
        recurrence: event.recurrence || initialRecurrence,
      });
    } else if (isOpen) {
      setFormValues((prev) => ({
        ...prev,
        calendar: calendars[0]?._id,
      }));
    }
  }, [isOpen, eventModal.event, calendars]);

  useEffect(() => {
    if (!isOpen) {
      setConflicts([]);
      return;
    }

    const start = buildDateTime(formValues.startDate, formValues.isAllDay ? '00:00' : formValues.startTime);
    const end = buildDateTime(formValues.endDate, formValues.isAllDay ? '23:59' : formValues.endTime);

    if (!start || !end || !formValues.calendar) return;

    setIsCheckingConflicts(true);
    const handler = setTimeout(async () => {
      const result = await checkConflicts({
        calendar: formValues.calendar,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        excludeEventId: eventModal.event?._id,
      });
      setConflicts(result);
      setIsCheckingConflicts(false);
    }, 500);

    return () => clearTimeout(handler);
  }, [formValues.startDate, formValues.startTime, formValues.endDate, formValues.endTime, formValues.isAllDay, formValues.calendar, checkConflicts, isOpen, eventModal.event]);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleReminderChange = (index, key, value) => {
    setFormValues((prev) => {
      const reminders = [...prev.reminders];
      reminders[index] = { ...reminders[index], [key]: value };
      return { ...prev, reminders };
    });
  };

  const addReminder = () => {
    setFormValues((prev) => ({
      ...prev,
      reminders: [...prev.reminders, defaultReminder],
    }));
  };

  const removeReminder = (index) => {
    setFormValues((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((_, idx) => idx !== index),
    }));
  };

  const handleAttendeeChange = (index, value) => {
    setFormValues((prev) => {
      const attendees = [...prev.attendees];
      attendees[index] = value;
      return { ...prev, attendees };
    });
  };

  const addAttendee = () => handleAttendeeChange(formValues.attendees.length, '');

  const removeAttendee = (index) => {
    setFormValues((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((_, idx) => idx !== index),
    }));
  };

  const handleRecurrenceChange = (key, value) => {
    setFormValues((prev) => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const start = buildDateTime(formValues.startDate, formValues.isAllDay ? '00:00' : formValues.startTime);
    const end = buildDateTime(formValues.endDate, formValues.isAllDay ? '23:59' : formValues.endTime);

    if (!start || !end) {
      return;
    }

    const payload = {
      title: formValues.title,
      description: formValues.description,
      calendar: formValues.calendar,
      color: formValues.color,
      isAllDay: formValues.isAllDay,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      location: formValues.location,
      attendees: formValues.attendees.filter(Boolean).map((email) => ({ email })),
      reminders: formValues.reminders,
      recurrence: formValues.recurrence,
      userId: 'demo-user',
    };

    if (isEditMode && eventModal.event?._id) {
      await updateEvent(eventModal.event._id, payload);
    } else {
      await createEvent(payload);
    }

    await loadEvents();
    closeEventModal();
  };

  const conflictMessage = useMemo(() => {
    if (!conflicts.length) return null;
    return `Conflicts with ${conflicts.length} existing event${conflicts.length > 1 ? 's' : ''}`;
  }, [conflicts]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog static open={isOpen} onClose={closeEventModal} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-6">
              <Dialog.Panel as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
              >
                <form onSubmit={handleSubmit} className="flex flex-col">
                  <header className="flex items-center justify-between border-b border-google-gray px-6 py-4">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-800">
                        {isEditMode ? 'Edit Event' : 'Create Event'}
                      </Dialog.Title>
                      <p className="text-sm text-slate-500">Set event details, attendees, reminders, and recurrence</p>
                    </div>
                    <button type="button" onClick={closeEventModal} className="rounded-full p-2 hover:bg-google-hover">
                      <X className="h-5 w-5 text-slate-500" />
                    </button>
                  </header>

                  <div className="grid gap-6 px-6 py-6 md:grid-cols-[2fr,1fr]">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Title</label>
                        <input
                          type="text"
                          value={formValues.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          className="w-full rounded-xl border border-google-gray px-4 py-2 focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                          placeholder="Event title"
                          required
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-600">Start</label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={formValues.startDate}
                              onChange={(e) => handleChange('startDate', e.target.value)}
                              className="w-full rounded-xl border border-google-gray px-3 py-2 focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                            />
                            {!formValues.isAllDay && (
                              <input
                                type="time"
                                value={formValues.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                className="w-full rounded-xl border border-google-gray px-3 py-2 focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                              />
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-600">End</label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={formValues.endDate}
                              onChange={(e) => handleChange('endDate', e.target.value)}
                              className="w-full rounded-xl border border-google-gray px-3 py-2 focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                            />
                            {!formValues.isAllDay && (
                              <input
                                type="time"
                                value={formValues.endTime}
                                onChange={(e) => handleChange('endTime', e.target.value)}
                                className="w-full rounded-xl border border-google-gray px-3 py-2 focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          id="all-day-toggle"
                          type="checkbox"
                          checked={formValues.isAllDay}
                          onChange={(e) => handleChange('isAllDay', e.target.checked)}
                          className="h-4 w-4 rounded border-google-gray text-google-blue focus:ring-google-blue"
                        />
                        <label htmlFor="all-day-toggle" className="text-sm font-medium text-slate-600">
                          All-day event
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" /> Location
                        </label>
                        <input
                          type="text"
                          value={formValues.location}
                          onChange={(e) => handleChange('location', e.target.value)}
                          placeholder="Add location"
                          className="w-full rounded-xl border border-google-gray px-4 py-2 focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Users className="h-4 w-4 text-slate-400" /> Attendees
                        </label>
                        <div className="space-y-2">
                          {formValues.attendees.map((value, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="email"
                                value={value}
                                onChange={(e) => handleAttendeeChange(index, e.target.value)}
                                placeholder="name@example.com"
                                className="w-full rounded-xl border border-google-gray px-4 py-2 focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                              />
                              <button
                                type="button"
                                onClick={() => removeAttendee(index)}
                                className="rounded-xl border border-google-gray px-3 text-sm text-slate-500 hover:bg-google-hover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addAttendee}
                            className="rounded-xl border border-dashed border-google-blue px-4 py-2 text-sm font-medium text-google-blue hover:bg-google-blue/5"
                          >
                            + Add attendee
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Bell className="h-4 w-4 text-slate-400" /> Reminders
                        </label>
                        <div className="space-y-2">
                          {formValues.reminders.map((reminder, index) => (
                            <div key={index} className="flex gap-2">
                              <select
                                value={reminder.method}
                                onChange={(e) => handleReminderChange(index, 'method', e.target.value)}
                                className="rounded-xl border border-google-gray px-3 py-2 text-sm focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                              >
                                <option value="popup">Notification</option>
                                <option value="email">Email</option>
                              </select>
                              <input
                                type="number"
                                min="0"
                                value={reminder.offsetMinutes}
                                onChange={(e) => handleReminderChange(index, 'offsetMinutes', Number(e.target.value))}
                                className="w-24 rounded-xl border border-google-gray px-3 py-2 text-sm focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                              />
                              <span className="flex items-center text-sm text-slate-500">minutes before</span>
                              <button
                                type="button"
                                onClick={() => removeReminder(index)}
                                className="rounded-xl border border-google-gray px-3 text-sm text-slate-500 hover:bg-google-hover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addReminder}
                            className="rounded-xl border border-dashed border-google-blue px-4 py-2 text-sm font-medium text-google-blue hover:bg-google-blue/5"
                          >
                            + Add reminder
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Calendar</label>
                        <select
                          value={formValues.calendar}
                          onChange={(e) => handleChange('calendar', e.target.value)}
                          className="w-full rounded-xl border border-google-gray px-4 py-2 text-sm focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                        >
                          {calendars.map((calendar) => (
                            <option key={calendar._id} value={calendar._id}>
                              {calendar.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Event color</label>
                        <div className="grid grid-cols-4 gap-2">
                          {GOOGLE_COLORS.map((color) => (
                            <button
                              type="button"
                              key={color}
                              onClick={() => handleChange('color', color)}
                              className={`flex h-10 w-full items-center justify-center rounded-xl border-2 transition ${
                                formValues.color === color ? 'border-slate-900' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Repeat className="h-4 w-4 text-slate-400" /> Recurrence
                        </label>
                        <select
                          value={formValues.recurrence.frequency}
                          onChange={(e) => handleRecurrenceChange('frequency', e.target.value)}
                          className="w-full rounded-xl border border-google-gray px-4 py-2 text-sm focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                        >
                          <option value="none">Does not repeat</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>

                        {formValues.recurrence.frequency !== 'none' && (
                          <div className="space-y-3 rounded-xl border border-google-gray bg-slate-50 p-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs uppercase text-slate-500">Interval</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={formValues.recurrence.interval}
                                  onChange={(e) => handleRecurrenceChange('interval', Number(e.target.value))}
                                  className="mt-1 w-full rounded-lg border border-google-gray px-3 py-2 text-sm focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                                />
                              </div>
                              <div>
                                <label className="text-xs uppercase text-slate-500">Count</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={formValues.recurrence.count || ''}
                                  onChange={(e) => handleRecurrenceChange('count', e.target.value ? Number(e.target.value) : '')}
                                  className="mt-1 w-full rounded-lg border border-google-gray px-3 py-2 text-sm focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs uppercase text-slate-500">Until</label>
                              <input
                                type="date"
                                value={formValues.recurrence.endDate || ''}
                                onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-google-gray px-3 py-2 text-sm focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Description</label>
                        <textarea
                          value={formValues.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-google-gray px-4 py-2 focus:border-google-blue focus:ring-2 focus:ring-google-blue/30"
                          placeholder="Add details, attachments, or meeting notes"
                        />
                      </div>

                      {conflictMessage && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {isCheckingConflicts ? 'Checking for conflicts...' : conflictMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  <footer className="flex items-center justify-between rounded-b-2xl border-t border-google-gray bg-slate-50 px-6 py-4">
                    <button
                      type="button"
                      onClick={closeEventModal}
                      className="rounded-full border border-google-gray px-5 py-2 text-sm font-medium text-slate-600 hover:bg-google-hover"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-3">
                      {isEditMode && eventModal.event?._id && (
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmDelete = window.confirm('Delete this event?');
                            if (!confirmDelete) return;
                            await deleteEvent(eventModal.event._id);
                            await loadEvents();
                            closeEventModal();
                          }}
                          className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      )}
                      <button
                        type="submit"
                        className="rounded-full bg-google-blue px-5 py-2 text-sm font-semibold text-white shadow-google hover:bg-blue-600"
                      >
                        Save
                      </button>
                    </div>
                  </footer>
                </form>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default EventModal;
