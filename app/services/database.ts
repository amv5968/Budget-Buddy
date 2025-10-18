import { Platform } from 'react-native';

let db: any = null;

if (Platform.OS !== 'web') {
   const SQLite = require('expo-sqlite');
   db = SQLite.openDatabaseSync('budgetbuddy.db');
 }

 export const initDatabase = (): void => {
   if (Platform.OS === 'web') {
     console.log('Database not supported on web in development');
     return;
   }

  try {
     db.execSync(`
       CREATE TABLE IF NOT EXISTS users (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
         email TEXT UNIQUE NOT NULL,
         password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
       );
     `);
     console.log('Database initialized successfully');
   } catch (error) {
     console.error('Error initializing database:', error);
   }
 };

 export default db;