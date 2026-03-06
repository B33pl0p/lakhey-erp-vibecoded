/**
 * Formats a number as Nepalese Rupees.
 * Uses "Rs" prefix (not the Indian ₹ symbol) as per NPR convention.
 * Example: formatCurrency(1500) → "Rs 1,500.00"
 */
export function formatCurrency(amount: number, decimals = 2): string {
  return `Rs ${amount.toLocaleString('en-NP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
