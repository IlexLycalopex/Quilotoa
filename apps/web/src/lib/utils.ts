import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatMonths(months: number): string {
  if (months >= 999) return 'N/A'
  if (months < 12) return `${months} months`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}m` : `${years} years`
}

export function ragColour(pct: number): 'red' | 'amber' | 'green' {
  if (pct < 40) return 'red'
  if (pct < 70) return 'amber'
  return 'green'
}
