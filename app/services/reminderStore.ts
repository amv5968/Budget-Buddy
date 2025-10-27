import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const REMINDER_KEY = 'bb.reminders.v1';

export type Reminder = {
  id: string;
  date: string;      // '2025-10-26'
  time: string;      // '09:00'
  message: string;   // 'Pay rent'
};

async function loadAll(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(REMINDER_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveAll(list: Reminder[]) {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(list));
}

// create + persist a new reminder
export async function addReminder(date: string, time: string, message: string): Promise<Reminder> {
  const all = await loadAll();
  const newOne: Reminder = {
    id: uuidv4(),
    date,
    time,
    message,
  };
  all.push(newOne);
  await saveAll(all);
  return newOne;
}

// get all reminders (for calendar dots, etc.)
export async function getReminders(): Promise<Reminder[]> {
  return loadAll();
}

// get reminders for a single day (to show in modal)
export async function getRemindersForDate(date: string): Promise<Reminder[]> {
  const all = await loadAll();
  return all.filter(r => r.date === date);
}

// delete reminder (for cancel/edit later)
export async function deleteReminder(id: string): Promise<void> {
  const all = await loadAll();
  const filtered = all.filter(r => r.id !== id);
  await saveAll(filtered);
}
