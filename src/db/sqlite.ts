// src/db/sqlite.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('budgetbuddy.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // --- migrations / schema ---
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense'))
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY,
      amount_cents INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense')),
      category_id INTEGER,
      note TEXT,
      occurred_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY,
      category_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      limit_cents INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      target_cents INTEGER NOT NULL,
      saved_cents INTEGER NOT NULL DEFAULT 0
    );
  `);

  return db;
}
