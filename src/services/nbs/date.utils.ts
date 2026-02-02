import { NbsRunRange } from './types';

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function resolveRange(range: NbsRunRange): { startDate: string; endDate: string } {
  if (range.startDate && range.endDate) {
    return { startDate: range.startDate, endDate: range.endDate };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = formatDate(yesterday);
  return { startDate: date, endDate: date };
}

export function getNextRun(dailyAt?: string): Date {
  const [hourStr, minStr] = (dailyAt || '01:00').split(':');
  const hour = Number(hourStr);
  const minute = Number(minStr);
  const now = new Date();
  const next = new Date(now);
  next.setHours(
    Number.isFinite(hour) ? hour : 1,
    Number.isFinite(minute) ? minute : 0,
    0,
    0
  );
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function extractYear(dateStr: string): string {
  const match = String(dateStr).match(/^(\d{4})/);
  return match ? match[1] : new Date().getFullYear().toString();
}
