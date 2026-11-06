import { STATS_PERIODS, StatsPeriod } from './constants';
import { MuscleGroup } from './types';
import { allRecords, detect, mostRelevant } from './records';
import { ExercisePerformance, PersonalRecord, StatsWorkout } from './statsTypes';
import { effectiveLoadKg, exerciseKey, performancesByExercise, totals, workoutVolumeKg } from './trainingMath';
import {
  DAY_IN_MS, addMonths, firstOfMonth, localDateOf, mondayOnOrBefore, startOfDay, toEpochDay,
} from '../utils/time';

export type Granularity = 'DAY' | 'WEEK' | 'MONTH';
export type ExerciseMetric =
  | 'ESTIMATED_ONE_REP_MAX' | 'MAX_WEIGHT' | 'WEIGHT_AT_REPS' | 'VOLUME' | 'REPETITIONS' | 'BEST_DURATION' | 'TOTAL_DURATION';

export const EXERCISE_METRICS: ExerciseMetric[] = [
  'ESTIMATED_ONE_REP_MAX', 'MAX_WEIGHT', 'WEIGHT_AT_REPS', 'VOLUME', 'REPETITIONS', 'BEST_DURATION', 'TOTAL_DURATION',
];

export interface SeriesPoint {
  timestamp: number;
  value: number;
}

export interface Range {
  start: number;
  end: number;
}

export const REP_MAX_TARGETS = [1, 3, 5, 8, 10, 12, 15];

const inRange = (t: number, r: Range) => t >= r.start && t < r.end;

export function periodRange(period: StatsPeriod, now: number, tz: string, firstWorkoutAt: number | null): Range {
  const today = toEpochDay(localDateOf(now, tz));
  const end = startOfDay(today + 1, tz);
  const days = STATS_PERIODS[period];
  const startDay = days === null
    ? (firstWorkoutAt != null ? toEpochDay(localDateOf(firstWorkoutAt, tz)) : today)
    : today - (days - 1);
  return { start: startOfDay(startDay, tz), end };
}

export const previousRange = (r: Range): Range => ({ start: r.start - (r.end - r.start), end: r.start });

export function weekRange(now: number, tz: string, weeksAgo = 0): Range {
  const monday = mondayOnOrBefore(toEpochDay(localDateOf(now, tz))) - 7 * weeksAgo;
  return { start: startOfDay(monday, tz), end: startOfDay(monday + 7, tz) };
}

export function granularityFor(period: StatsPeriod, range: Range): Granularity {
  switch (period) {
    case 'WEEK':
    case 'MONTH':
      return 'DAY';
    case 'QUARTER':
    case 'HALF_YEAR':
      return 'WEEK';
    case 'YEAR':
      return 'MONTH';
    default:
      return range.end - range.start <= 120 * DAY_IN_MS ? 'WEEK' : 'MONTH';
  }
}

export function bucketStarts(range: Range, granularity: Granularity, tz: string): number[] {
  const startDay = toEpochDay(localDateOf(range.start, tz));
  let cursor = granularity === 'DAY' ? startDay : granularity === 'WEEK' ? mondayOnOrBefore(startDay) : firstOfMonth(startDay);
  const buckets: number[] = [];
  for (;;) {
    const millis = startOfDay(cursor, tz);
    if (millis >= range.end) break;
    buckets.push(millis);
    cursor = granularity === 'DAY' ? cursor + 1 : granularity === 'WEEK' ? cursor + 7 : addMonths(cursor, 1);
  }
  return buckets;
}

function bucketize<T>(buckets: number[], items: T[], timeOf: (t: T) => number, valueOf: (list: T[]) => number): SeriesPoint[] {
  const grouped = buckets.map(() => [] as T[]);
  for (const item of items) {
    const time = timeOf(item);
    let index = -1;
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (buckets[i] <= time) {
        index = i;
        break;
      }
    }
    grouped[Math.max(index, 0)].push(item);
  }
  return buckets.map((start, i) => ({ timestamp: start, value: valueOf(grouped[i]) }));
}

export function series(performances: ExercisePerformance[], metric: ExerciseMetric, minRepetitions = 5): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const p of [...performances].sort((a, b) => a.date - b.date)) {
    let value: number | null = null;
    switch (metric) {
      case 'ESTIMATED_ONE_REP_MAX': value = p.estimatedOneRepMaxKg; break;
      case 'MAX_WEIGHT': value = p.topWeightKg; break;
      case 'WEIGHT_AT_REPS': {
        const weights = p.sets.filter((s) => (s.repetitions ?? 0) >= minRepetitions && (s.weightKg ?? 0) > 0).map((s) => s.weightKg as number);
        value = weights.length ? Math.max(...weights) : null;
        break;
      }
      case 'VOLUME': value = p.volumeKg > 0 ? p.volumeKg : null; break;
      case 'REPETITIONS': value = p.totalRepetitions > 0 ? p.totalRepetitions : null; break;
      case 'BEST_DURATION': value = p.bestDurationSeconds; break;
      case 'TOTAL_DURATION': value = p.totalDurationSeconds > 0 ? p.totalDurationSeconds : null; break;
    }
    if (value != null) points.push({ timestamp: p.date, value });
  }
  return points;
}

export function defaultMetric(type: string, performances: ExercisePerformance[]): ExerciseMetric {
  if (type === 'DURATION') return 'BEST_DURATION';
  return performances.some((p) => p.estimatedOneRepMaxKg != null) ? 'ESTIMATED_ONE_REP_MAX' : 'REPETITIONS';
}

export function topExercises(workouts: StatsWorkout[], limit = 4) {
  return [...performancesByExercise(workouts).values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, limit)
    .map((performances) => {
      const first = performances[0];
      const pts = series(performances, defaultMetric(first.type, performances));
      const firstValue = pts[0]?.value ?? null;
      const lastValue = pts[pts.length - 1]?.value ?? null;
      return {
        exerciseRef: first.exerciseRef,
        exerciseName: performances[performances.length - 1].exerciseName,
        type: first.type,
        sessions: performances.length,
        series: pts,
        firstValue,
        lastValue,
        changeRatio: firstValue != null && lastValue != null && firstValue > 0 ? (lastValue - firstValue) / firstValue : null,
      };
    });
}

export function dashboard(history: StatsWorkout[], period: StatsPeriod, now: number, tz: string) {
  const sorted = [...history].sort((a, b) => a.startedAt - b.startedAt);
  const range = periodRange(period, now, tz, sorted[0]?.startedAt ?? null);
  const previous = previousRange(range);
  const inPeriod = sorted.filter((w) => inRange(w.startedAt, range));
  const inPrevious = sorted.filter((w) => inRange(w.startedAt, previous));
  const thisWeek = weekRange(now, tz);
  const lastWeek = weekRange(now, tz, 1);
  const granularity = granularityFor(period, range);
  const buckets = bucketStarts(range, granularity, tz);
  const frequencyGranularity: Granularity = granularity === 'DAY' ? 'WEEK' : granularity;
  const frequencyBuckets = bucketStarts(range, frequencyGranularity, tz);
  const periodDays = Math.max(Math.floor((range.end - range.start) / DAY_IN_MS), 1);

  const muscles = new Map<MuscleGroup, number>();
  for (const w of inPeriod) {
    for (const e of w.exercises) {
      const muscle = e.muscleGroups[0];
      if (!muscle) continue;
      const count = e.sets.filter((s) => s.status === 'COMPLETED').length;
      if (count) muscles.set(muscle, (muscles.get(muscle) ?? 0) + count);
    }
  }

  const recordsFrom = now - 30 * DAY_IN_MS;
  const recentRecords: PersonalRecord[] = mostRelevant(allRecords(sorted))
    .filter((r) => r.achievedAt >= Math.min(recordsFrom, range.start))
    .slice(0, 8);

  const volumes = sorted.map(workoutVolumeKg);

  return {
    period,
    periodTotals: totals(inPeriod),
    previousPeriodTotals: totals(inPrevious),
    thisWeek: totals(sorted.filter((w) => inRange(w.startedAt, thisWeek))),
    lastWeek: totals(sorted.filter((w) => inRange(w.startedAt, lastWeek))),
    frequencyPerWeek: inPeriod.length / Math.max(periodDays / 7, 1),
    granularity,
    volumeSeries: bucketize(buckets, inPeriod, (w) => w.startedAt, (l) => l.reduce((s, w) => s + workoutVolumeKg(w), 0)),
    durationSeries: bucketize(buckets, inPeriod, (w) => w.startedAt, (l) => l.reduce((s, w) => s + w.durationMs, 0) / 60_000),
    frequencySeries: bucketize(frequencyBuckets, inPeriod, (w) => w.startedAt, (l) => l.length),
    frequencyGranularity,
    muscleDistribution: [...muscles.entries()].sort((a, b) => b[1] - a[1]).map(([muscleGroup, count]) => ({ muscleGroup, count })),
    recentRecords,
    topExercises: topExercises(inPeriod),
    lastWorkoutId: sorted.length ? sorted[sorted.length - 1].id : null,
    bestSessionVolumeKg: volumes.length ? Math.max(...volumes) : null,
    totalWorkouts: sorted.length,
  };
}

const maxOrNull = (values: Array<number | null | undefined>): number | null => {
  const f = values.filter((v): v is number => v != null);
  return f.length ? Math.max(...f) : null;
};

export function comparePeriods(performances: ExercisePerformance[], period: StatsPeriod, now: number, tz: string) {
  const range = periodRange(period, now, tz, performances.length ? Math.min(...performances.map((p) => p.date)) : null);
  const previous = previousRange(range);
  const current = performances.filter((p) => inRange(p.date, range));
  const before = performances.filter((p) => inRange(p.date, previous));
  return {
    currentSessions: current.length,
    previousSessions: before.length,
    currentBestOneRepMax: maxOrNull(current.map((p) => p.estimatedOneRepMaxKg)),
    previousBestOneRepMax: maxOrNull(before.map((p) => p.estimatedOneRepMaxKg)),
    currentMaxWeight: maxOrNull(current.map((p) => p.topWeightKg)),
    previousMaxWeight: maxOrNull(before.map((p) => p.topWeightKg)),
    currentVolume: current.reduce((s, p) => s + p.volumeKg, 0),
    previousVolume: before.reduce((s, p) => s + p.volumeKg, 0),
    currentBestDuration: maxOrNull(current.map((p) => p.bestDurationSeconds)),
    previousBestDuration: maxOrNull(before.map((p) => p.bestDurationSeconds)),
  };
}

export function exerciseProgress(exerciseRef: string, history: StatsWorkout[], period: StatsPeriod, now: number, tz: string) {
  const performances = performancesByExercise(history).get(exerciseKey(exerciseRef, '')) ?? [];
  const allSets = performances.flatMap((p) => p.sets.map((set) => ({ p, set })));

  const repMaxes = REP_MAX_TARGETS.flatMap((target) => {
    const candidates = allSets.filter(({ set }) => (set.repetitions ?? 0) >= target && (set.weightKg ?? 0) > 0);
    if (!candidates.length) return [];
    const best = candidates.reduce((a, b) => ((b.set.weightKg as number) > (a.set.weightKg as number) ? b : a));
    return [{ repetitions: target, weightKg: best.set.weightKg as number, achievedAt: best.p.date }];
  });

  const records = performances
    .flatMap((perf, i) => detect(performances.slice(0, i), perf))
    .sort((a, b) => b.achievedAt - a.achievedAt);

  const setVolumes = allSets
    .map(({ p, set }) => (set.repetitions == null ? 0 : set.repetitions * effectiveLoadKg(set.weightKg, p.loadMode)))
    .filter((v) => v > 0);

  return {
    exerciseRef,
    performances,
    records,
    repMaxes,
    maxWeightKg: maxOrNull(performances.map((p) => p.topWeightKg)),
    bestOneRepMaxKg: maxOrNull(performances.map((p) => p.estimatedOneRepMaxKg)),
    bestSetVolumeKg: setVolumes.length ? Math.max(...setVolumes) : null,
    bestSessionVolumeKg: maxOrNull(performances.map((p) => p.volumeKg).filter((v) => v > 0)),
    maxRepetitions: maxOrNull(allSets.map(({ set }) => set.repetitions)),
    maxDurationSeconds: maxOrNull(performances.map((p) => p.bestDurationSeconds)),
    totalSets: allSets.length,
    totalRepetitions: performances.reduce((s, p) => s + p.totalRepetitions, 0),
    series: Object.fromEntries(EXERCISE_METRICS.map((m) => [m, series(performances, m)])),
    comparison: comparePeriods(performances, period, now, tz),
  };
}
