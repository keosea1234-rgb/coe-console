import { FYS, FY_RANGE, type FY, type Status } from './constants';
import type { SourcingEvent } from './types';

/** Amcor FY runs July–June. Returns the FY label for a calendar date. */
export function getFiscalYearFromDate(date: string): FY {
  const d = new Date(date + 'T00:00:00');
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const fyEndYear = month >= 7 ? year + 1 : year;
  const candidate = `FY${String(fyEndYear).slice(-2)}` as FY;
  if (FYS.includes(candidate)) return candidate;
  if (candidate < FYS[0]) return FYS[0];
  return FYS[FYS.length - 1];
}

/** Derive a default pipeline status from the event date relative to today. */
export function deriveStatusFromDate(date: string): Status {
  const today = startOfDay(new Date());
  const eventDay = startOfDay(new Date(date + 'T00:00:00'));
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays > 0) return 'Planned';
  if (diffDays >= -7) return 'Live';
  return 'Completed';
}

/** Next sequential event id for a fiscal year, e.g. `EVT-FY26-0016`. */
export function generateNextEventId(fy: FY, events: SourcingEvent[]): string {
  const prefix = `EVT-${fy}-`;
  let maxNum = 0;
  for (const e of events) {
    if (!e.id.startsWith(prefix)) continue;
    const num = parseInt(e.id.slice(prefix.length), 10);
    if (!Number.isNaN(num) && num > maxNum) maxNum = num;
  }
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
}

/** Increment the numeric suffix of an event id by `offset`. */
export function offsetEventId(baseId: string, offset: number): string {
  const match = baseId.match(/^(EVT-FY\d+-)(\d+)$/);
  if (!match) return `${baseId}-${offset}`;
  const num = parseInt(match[2], 10) + offset;
  return `${match[1]}${String(num).padStart(4, '0')}`;
}

export function isDateInFY(date: string, fy: FY): boolean {
  const { start, end } = FY_RANGE[fy];
  return date >= start && date <= end;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function prefersAmcorEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@amcor.com');
}
