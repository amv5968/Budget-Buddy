export function formatCurrencyFromCents(cents: number): string {
    if (!Number.isFinite(cents)) cents = 0;
    return `$${(cents / 100).toFixed(2)}`;
}