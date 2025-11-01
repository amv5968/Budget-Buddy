//app/services/reminderStore.ts

import api from './api';

export type Reminder = {
  id: string;
  date: string;   // 'YYYY-MM-DD'
  time: string;   // 'HH:MM'
  message: string;
};

// Get ALL reminders (for calendar dots)
export async function getReminders(): Promise<Reminder[]> {
  try {
    console.log('[getReminders] fetching all reminders from backend...');
    const res = await api.get('/reminders');
    console.log('[getReminders] backend response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('[getReminders] error:', error.response?.data || error.message);
    throw error;
  }
}

// Get reminders for a single date
export async function getRemindersForDate(date: string): Promise<Reminder[]> {
  try {
    console.log('[getRemindersForDate] fetching for date:', date);
    const res = await api.get(`/reminders/${date}`);
    console.log('[getRemindersForDate] backend response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('[getRemindersForDate] error:', error.response?.data || error.message);
    throw error;
  }
}

// Add new reminder
export async function addReminder(
  date: string,
  time: string,
  message: string
): Promise<Reminder> {
  try {
    console.log('[addReminder] sending to backend:', { date, time, message });
    const res = await api.post('/reminders', { date, time, message });
    console.log('[addReminder] backend response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('[addReminder] error:', error.response?.data || error.message);
    throw error;
  }
}
