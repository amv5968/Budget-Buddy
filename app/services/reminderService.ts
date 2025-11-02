
// Temporary local in-memory storage for reminders
let reminders: { date: string; time: string; message: string }[] = [];

// Save a new reminder
export const addReminder = async (date: string, time: string, message: string) => {
  const newReminder = { date, time, message };
  reminders.push(newReminder);
  return newReminder;
};

// Get reminders for a specific date
export const getRemindersForDate = async (date: string) => {
  return reminders.filter(r => r.date === date);
};

// Get all reminders
export const getReminders = async () => {
  return reminders;
};

// Load all reminders grouped by date for the calendar view
export const loadAllRemindersForCalendar = async () => {
  const grouped: Record<string, { time: string; message: string }[]> = {};
  for (const r of reminders) {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push({ time: r.time, message: r.message });
  }
  return grouped;
};
