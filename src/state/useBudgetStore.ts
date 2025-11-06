import { create } from 'zustand';

type BudgetsState = {
  totals: number;            
  budgets: number[];          
  setTotals: (t: number) => void;
  setBudgets: (b: number[]) => void;
};

export const useBudgetStore = create<BudgetsState>((set) => ({
  totals: 0,
  budgets: [],
  setTotals: (t) => set({ totals: t }),
  setBudgets: (b) => set({ budgets: b }),
}));
