export interface LocalDate {
  y: number;
  m: number;
  d: number;
}

const DAY_MS = 86_400_000;

function formatter(tz: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  });
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function parts(ts: number, tz: string) {
  let f = formatters.get(tz);
  if (!f) {
    f = formatter(tz);
    formatters.set(tz, f);
  }
  const out: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(ts))) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return out;
}

export function isValidTimezone(tz: string): boolean {
  try {
    formatter(tz);
    return true;
  } catch {
    return false;
  }
}

function offsetMs(ts: number, tz: string): number {
  const p = parts(Math.floor(ts / 1000) * 1000, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ts / 1000) * 1000;
}

/** Jours depuis 1970-01-01 pour une date calendaire locale. */
export function toEpochDay(date: LocalDate): number {
  return Math.round(Date.UTC(date.y, date.m - 1, date.d) / DAY_MS);
}

export function fromEpochDay(day: number): LocalDate {
  const dt = new Date(day * DAY_MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function localDateOf(ts: number, tz: string): LocalDate {
  const p = parts(ts, tz);
  return { y: p.year, m: p.month, d: p.day };
}

/** Instant UTC (ms) correspondant à `hour:minute` locale d'un jour donné dans `tz`. */
export function zonedToUtc(day: number, tz: string, hour = 0, minute = 0): number {
  const { y, m, d } = fromEpochDay(day);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const first = guess - offsetMs(guess, tz);
  const second = guess - offsetMs(first, tz);
  return second;
}

export const startOfDay = (day: number, tz: string): number => zonedToUtc(day, tz);

/** Lundi de la semaine contenant `day` (le 1970-01-01 est un jeudi). */
export function mondayOnOrBefore(day: number): number {
  return day - ((((day + 3) % 7) + 7) % 7);
}

export function firstOfMonth(day: number): number {
  const { y, m } = fromEpochDay(day);
  return toEpochDay({ y, m, d: 1 });
}

export function addMonths(day: number, months: number): number {
  const { y, m, d } = fromEpochDay(day);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const lastDay = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return toEpochDay({ y: ny, m: nm, d: Math.min(d, lastDay) });
}

export const DAY_IN_MS = DAY_MS;
