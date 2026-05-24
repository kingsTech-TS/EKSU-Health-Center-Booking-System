import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatError(detail: any): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => (typeof d === 'object' ? d.msg : d)).join(', ');
  }
  if (typeof detail === 'object' && detail !== null) {
    return detail.msg || JSON.stringify(detail);
  }
  return 'An unexpected error occurred';
}
