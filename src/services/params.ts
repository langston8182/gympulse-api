import { DEFAULT_TIMEZONE, STATS_PERIODS, StatsPeriod } from '../domain/constants';
import { HttpError } from '../utils/validation';
import { isValidTimezone } from '../utils/time';

export function parsePeriod(value: string | undefined, fallback: StatsPeriod = 'MONTH'): StatsPeriod {
  if (value === undefined) return fallback;
  if (!(value in STATS_PERIODS)) {
    throw new HttpError(400, 'Paramètre period invalide', { allowed: Object.keys(STATS_PERIODS) });
  }
  return value as StatsPeriod;
}

/** Fuseau IANA du client (`?tz=Europe/Paris`), utilisé pour découper jours, semaines et mois. */
export function parseTimezone(value: string | undefined): string {
  if (value === undefined) return DEFAULT_TIMEZONE;
  if (!isValidTimezone(value)) throw new HttpError(400, 'Paramètre tz invalide');
  return value;
}
