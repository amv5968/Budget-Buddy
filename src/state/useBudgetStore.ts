import { create } from 'zustand';

type Totals = { monthSpendCents: number; monthIncomeCents: number };
type Budget = { id: number; categoryId: number; period: string; limitCents: number };

type Store = {
  totals: Totals;
  budgets: Budget[];
  setTotals: (t: Totals) => void;
  setBudgets: (b: Budget[]) => void;
};

export const useBudgetStore = create<Store>((set) => ({
  totals: { monthSpendCents: 0, monthIncomeCents: 0 },
  budgets: [],
  setTotals: (t) => set({ totals: t }),
  setBudgets: (b) => set({ budgets: b }),
}));
