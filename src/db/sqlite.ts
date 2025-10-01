import * as SQLite from 'expo-sqlite';
export const db = SQLite.openDatabase('budgetbuddy.db');

export function migrate() {
  db.transaction(tx => {
    tx.executeSql(`PRAGMA foreign_keys = ON;`);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income','expense'))
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY,
        amount_cents INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income','expense')),
        category_id INTEGER,
        note TEXT,
        occurred_at INTEGER NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY,
        category_id INTEGER NOT NULL,
        period TEXT NOT NULL,
        limit_cents INTEGER NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        target_cents INTEGER NOT NULL,
        saved_cents INTEGER NOT NULL DEFAULT 0
      );
    `);
  });
}