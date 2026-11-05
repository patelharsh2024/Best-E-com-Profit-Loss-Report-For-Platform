/**
 * Currency utility tailored for Indian Rupees (INR - ₹) and international commerce
 */

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

/**
 * Format a number into standard Indian Rupee representation (e.g. ₹1,450.00 or ₹1,25,000.00)
 */
export function formatCurrency(amount: number | null | undefined): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(num);
  } catch {
    // Fallback if Intl.NumberFormat lacks INR
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Indian numbering format regex: last 3 digits, then groups of 2
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formatted = otherNumbers !== '' 
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree 
      : lastThree;
      
    return `₹${formatted}.${decimalPart}`;
  }
}

/**
 * Compact Indian currency formatting (e.g. ₹45K, ₹2.5L, ₹1.2Cr)
 */
export function formatCompactCurrency(amount: number | null | undefined): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return formatCurrency(num);
}
