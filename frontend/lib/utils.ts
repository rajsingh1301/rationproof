import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function kg(value: string | number | null | undefined) {
  return value == null ? 'Unknown' : `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 3 })} kg`;
}
export const commodityNames = { rice: 'Rice / Chawal', wheat: 'Wheat / Gehun' };
export function monthLabel(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return 'Monthly record';
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
