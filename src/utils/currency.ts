export function formatCurrencyFromCents(cents: number, currency = 'USD') {
    const amount = (cents ?? 0) / 100;
    return amount.toLocaleString(undefined, { style: 'currency', currency });
  }
  