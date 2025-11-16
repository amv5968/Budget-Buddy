// app/services/reminderService.ts
import api from './api';

export type Reminder = {
  id: string;
  date: string;   // 'YYYY-MM-DD'
  time: string;   // 'HH:MM'
  message: string;
};

/**
 * ✅ Fetch all reminders for all dates
 * Used for calendar dot marking and scheduling.
 */
export async function getReminders(): Promise<Reminder[]> {
  try {
    console.log('[getReminders] Fetching all reminders from backend...');
    const res = await api.get('/reminders');
    console.log('[getReminders] Response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('[getReminders] Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * ✅ Fetch reminders for a specific date (YYYY-MM-DD)
 */
export async function getRemindersForDate(date: string): Promise<Reminder[]> {
  try {
    console.log('[getRemindersForDate] Fetching reminders for', date);
    const res = await api.get(`/reminders/${date}`);
    console.log('[getRemindersForDate] Response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('[getRemindersForDate] Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * ✅ Add a new reminder for a given date/time/message
 */
export async function addReminder(
  date: string,
  time: string,
  message: string
): Promise<Reminder> {
  try {
    console.log('[addReminder] Sending new reminder to backend:', { date, time, message });
    const res = await api.post('/reminders', { date, time, message });
    console.log('[addReminder] Response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('[addReminder] Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * ✅ Optional helper to delete a reminder (if you later add that feature)
 */
export async function deleteReminder(id: string): Promise<void> {
  try {
    console.log('[deleteReminder] Deleting reminder:', id);
    await api.delete(`/reminders/${id}`);
  } catch (error: any) {
    console.error('[deleteReminder] Error:', error.response?.data || error.message);
    throw error;
  }
}
