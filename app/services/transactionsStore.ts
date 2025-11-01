
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

export type Txn = {
  id: number;
  name: string;
  category: string;
  amount: number;      // negative for Expense, positive for Income (or keep your type field)
  date: string;
  type: 'Income' | 'Expense';
  icon?: string;
};

const KEY = '@bb:transactions';
const bus = new EventEmitter();

export const onTransactionsChanged = (fn: (txns: Txn[]) => void) => {
  bus.addListener('transactions:changed', fn);
  return () => bus.removeListener('transactions:changed', fn);
};

async function save(all: Txn[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
  bus.emit('transactions:changed', all);
}

export async function getAll(): Promise<Txn[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Txn[]; } catch { return []; }
}

export async function add(txn: Txn) {
  const all = await getAll();
  all.unshift(txn);
  await save(all);
}

export async function update(id: number, patch: Partial<Txn>) {
  const all = await getAll();
  const next = all.map(t => (t.id === id ? { ...t, ...patch } : t));
  await save(next);
}

export async function remove(id: number) {
  const all = await getAll();
  await save(all.filter(t => t.id !== id));
}

export async function clearAll() {
  await save([]);
}