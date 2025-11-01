
type Tx = {
    type?: 'Income' | 'Expense' | string;
    category?: string;
    amount?: number | string;
    date?: string;
    createdAt?: string;
  };
  
  type BudgetShape = {
    totalAmount?: number | string;
    spentAmount?: number | string;
  };
  
  type GoalShape = {
    targetAmount?: number | string;
    savedAmount?: number | string;
  };
  
  function toNum(n: unknown): number {
    const v = typeof n === 'string' ? Number(n) : (n as number) ?? 0;
    return Number.isFinite(v) ? v : 0;
  }
  
  function isSameMonth(d: Date, ref: Date) {
    return d.getUTCFullYear() === ref.getUTCFullYear() && d.getUTCMonth() === ref.getUTCMonth();
  }
  
  /** Average daily expense over the last `daysWindow` days. */
  export function computeBurnRate(transactions: Tx[], daysWindow = 30): number {
    if (!Array.isArray(transactions) || transactions.length === 0 || daysWindow <= 0) return 0;
    const now = new Date();
    const start = new Date(now.getTime() - daysWindow * 24 * 60 * 60 * 1000);
  
    let totalExpense = 0;
    for (const t of transactions) {
      if (t?.type === 'Expense') {
        const dtSrc = t.date ?? t.createdAt;
        const dt = dtSrc ? new Date(dtSrc) : new Date(NaN);
        if (!Number.isNaN(+dt) && dt >= start && dt <= now) {
          totalExpense += toNum(t.amount);
        }
      }
    }
    return totalExpense / daysWindow;
  }
  
  /** Top-K expense categories for the current month. */
  export function topKExpenseCategories(
    transactions: Tx[],
    k = 3,
    monthRef?: Date
  ): Array<{ category: string; total: number }> {
    if (!Array.isArray(transactions) || transactions.length === 0 || k <= 0) return [];
    const ref = monthRef ?? new Date();
    const byCat = new Map<string, number>();
  
    for (const t of transactions) {
      if (t?.type === 'Expense') {
        const dtSrc = t.date ?? t.createdAt;
        const dt = dtSrc ? new Date(dtSrc) : new Date(NaN);
        if (!Number.isNaN(+dt) && isSameMonth(dt, ref)) {
          const key = t.category ? String(t.category) : 'Uncategorized';
          byCat.set(key, (byCat.get(key) || 0) + toNum(t.amount));
        }
      }
    }
  
    const arr = [...byCat.entries()].map(([category, total]) => ({ category, total }));
    arr.sort((a, b) => b.total - a.total);
    return arr.slice(0, k);
  }
  
  /** % remaining for a given budget (0–100). */
  export function percentRemaining(b: BudgetShape): number {
    const total = toNum(b?.totalAmount);
    const spent = toNum(b?.spentAmount);
    if (total <= 0) return 0;
    const pct = ((total - spent) / total) * 100;
    return Math.max(0, Math.min(100, pct));
  }
  
  /** True if remaining % is below threshold. */
  export function isNearLimit(b: BudgetShape, thresholdPct = 10): boolean {
    return percentRemaining(b) < thresholdPct;
  }
  
  /** True if spent exceeds total. */
  export function budgetOverrun(b: BudgetShape): boolean {
    return toNum(b?.spentAmount) > toNum(b?.totalAmount);
  }
  
  /** For goals: remaining amount and % saved (0–100). */
  export function goalDelta(g: GoalShape): { remaining: number; pct: number } {
    const target = toNum(g?.targetAmount);
    const saved = toNum(g?.savedAmount);
    const remaining = Math.max(0, target - saved);
    const pct = target > 0 ? Math.max(0, Math.min(100, (saved / target) * 100)) : 0;
    return { remaining, pct };
  }
  