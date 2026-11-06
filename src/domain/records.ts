import { ExercisePerformance, PersonalRecord, RecordType, StatsWorkout } from './statsTypes';
import { exerciseKey, performance, performancesByExercise } from './trainingMath';

const EPSILON = 1e-6;

/** Ordre d'affichage quand plusieurs records tombent sur un même exercice lors d'une séance. */
export const RECORD_PRIORITY: RecordType[] = [
  'MAX_WEIGHT', 'ESTIMATED_ONE_REP_MAX', 'MAX_REPETITIONS', 'MAX_DURATION', 'SESSION_VOLUME', 'BEST_SET_VOLUME',
];

const maxOrNull = (values: Array<number | null | undefined>): number | null => {
  const f = values.filter((v): v is number => v != null);
  return f.length ? Math.max(...f) : null;
};

/** Une première performance n'est jamais un record : il n'y a rien à battre. */
export function detect(previous: ExercisePerformance[], current: ExercisePerformance): PersonalRecord[] {
  if (previous.length === 0) return [];
  const records: PersonalRecord[] = [];

  const record = (type: RecordType, value: number | null, best: number | null, reps: number | null = null, weight: number | null = null) => {
    if (value == null || value <= 0) return;
    if (best != null && value <= best + EPSILON) return;
    records.push({
      exerciseRef: current.exerciseRef,
      exerciseName: current.exerciseName,
      type,
      value,
      previousValue: best,
      repetitions: reps,
      weightKg: weight,
      achievedAt: current.date,
      executionId: current.executionId,
    });
  };

  record('MAX_WEIGHT', current.topWeightKg, maxOrNull(previous.map((p) => p.topWeightKg)), current.topWeightRepetitions, current.topWeightKg);
  record('ESTIMATED_ONE_REP_MAX', current.estimatedOneRepMaxKg, maxOrNull(previous.map((p) => p.estimatedOneRepMaxKg)));

  if (current.sets.every((s) => (s.weightKg ?? 0) <= 0)) {
    const bestReps = maxOrNull(previous.flatMap((p) => p.sets).filter((s) => (s.weightKg ?? 0) <= 0).map((s) => s.repetitions));
    record('MAX_REPETITIONS', maxOrNull(current.sets.map((s) => s.repetitions)), bestReps);
  }

  record('MAX_DURATION', current.bestDurationSeconds, maxOrNull(previous.map((p) => p.bestDurationSeconds)));
  record('SESSION_VOLUME', current.volumeKg, maxOrNull(previous.map((p) => p.volumeKg).filter((v) => v > 0)));

  return records;
}

/** Records battus pendant `workout`, comparé à toutes les séances antérieures de `history`. */
export function detectForWorkout(history: StatsWorkout[], workout: StatsWorkout): PersonalRecord[] {
  const earlier = history.filter((w) => w.id !== workout.id && w.startedAt < workout.startedAt);
  const previousByExercise = performancesByExercise(earlier);
  return workout.exercises
    .map((e) => performance(workout, e))
    .filter((p): p is ExercisePerformance => p !== null)
    .flatMap((perf) => detect(previousByExercise.get(exerciseKey(perf.exerciseRef, perf.exerciseName)) ?? [], perf));
}

export function allRecords(history: StatsWorkout[]): PersonalRecord[] {
  const out: PersonalRecord[] = [];
  for (const performances of performancesByExercise(history).values()) {
    performances.forEach((perf, index) => out.push(...detect(performances.slice(0, index), perf)));
  }
  return out.sort((a, b) => a.achievedAt - b.achievedAt);
}

/** Garde le record le plus significatif par exercice et par séance. */
export function mostRelevant(records: PersonalRecord[]): PersonalRecord[] {
  const groups = new Map<string, PersonalRecord[]>();
  for (const r of records) {
    const key = `${r.executionId}|${exerciseKey(r.exerciseRef, r.exerciseName)}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.values()]
    .map((g) => g.reduce((best, r) => (RECORD_PRIORITY.indexOf(r.type) < RECORD_PRIORITY.indexOf(best.type) ? r : best)))
    .sort((a, b) => b.achievedAt - a.achievedAt);
}
