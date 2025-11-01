import apiClient from './apiClient';

export const fetchEvents = async (params = {}) => {
  const response = await apiClient.get('/events', { params });
  return response.data;
};

export const fetchCalendars = async (params = {}) => {
  const response = await apiClient.get('/calendars', { params });
  return response.data;
};

export const createEvent = async (payload) => {
  const response = await apiClient.post('/events', payload);
  return response.data;
};

export const updateEvent = async (id, payload) => {
  const response = await apiClient.put(`/events/${id}`, payload);
  return response.data;
};

export const deleteEvent = async (id) => {
  await apiClient.delete(`/events/${id}`);
};

export const checkEventConflicts = async (payload) => {
  const response = await apiClient.post('/events/conflicts', payload);
  return response.data;
};
