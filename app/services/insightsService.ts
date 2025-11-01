
import { Transaction } from './transactionService';

export function buildInsights(
  transactions: Transaction[],
  monthlyAllowance: number,
  monthStartISO: string,
  prevMonthStartISO: string,
  prevMonthEndISO: string,
) {
  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date).toISOString();
    return d >= monthStartISO;
  });

  const expenses = thisMonthTx.filter(t => t.type === 'Expense');
  const income = thisMonthTx.filter(t => t.type === 'Income');

  const totalExpense = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const t of expenses) {
    byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
  }

  const topCategory = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])[0] ?? null;

  const allowanceUsedPct =
    monthlyAllowance > 0 ? (totalExpense / monthlyAllowance) * 100 : 0;

  // previous period
  const prevMonthTx = transactions.filter(t => {
    const d = new Date(t.date).toISOString();
    return d >= prevMonthStartISO && d < prevMonthEndISO;
  });

  const prevExpensesTotal = prevMonthTx
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const trendDiff = totalExpense - prevExpensesTotal;
  const trendDirection =
    trendDiff > 0 ? 'up' : trendDiff < 0 ? 'down' : 'flat';

  return {
    totalExpense,
    totalIncome,
    allowanceUsedPct,
    topCategoryName: topCategory ? topCategory[0] : null,
    topCategoryAmount: topCategory ? topCategory[1] : 0,
    prevExpensesTotal,
    trendDiff,
    trendDirection,
  };
}

export function buildAIBuddyMessages(insights: ReturnType<typeof buildInsights>) {
  const {
    totalExpense,
    allowanceUsedPct,
    topCategoryName,
    topCategoryAmount,
    prevExpensesTotal,
    trendDiff,
    trendDirection,
  } = insights;

  const statusText = [
    `You've spent $${totalExpense.toFixed(2)} so far this month.`,
    topCategoryName
      ? `Your #1 category is ${topCategoryName} ($${topCategoryAmount.toFixed(
          2
        )}).`
      : `You haven't logged any spending this month yet.`,
    `You've used ${allowanceUsedPct.toFixed(
      0
    )}% of your allowance so far.`,
    `Last month you spent $${prevExpensesTotal.toFixed(
      2
    )}. You're currently ${
      trendDirection === 'up'
        ? `+$${Math.abs(trendDiff).toFixed(2)} higher`
        : trendDirection === 'down'
        ? `$${Math.abs(trendDiff).toFixed(2)} lower`
        : 'about the same'
    } vs last month.`,
  ].join(' ');

  let adviceText = '';
  if (allowanceUsedPct >= 90) {
    adviceText =
      "⚠ You're close to your limit. Try a 'no-spend' day or pause eating out for a few days.";
  } else if (trendDirection === 'up' && trendDiff > 50) {
    adviceText =
      "Your spending is rising compared to last month. Pick one category to cap this week (like food or shopping).";
  } else {
    adviceText =
      "Nice pacing. Keep logging transactions daily so you don't get surprise overspend at the end of the month.";
  }

  return { statusText, adviceText };
}
