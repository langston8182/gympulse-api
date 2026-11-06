import {
  ExercisePerformance, StatsExercise, StatsSet, StatsWorkout, WorkoutTotals,
} from './statsTypes';
import { LoadMode } from './constants';

/** Plus grand nombre de répétitions pour lequel l'estimation du 1RM reste pertinente. */
export const MAX_REPS_FOR_ONE_REP_MAX = 12;

const completed = (set: StatsSet) => set.status === 'COMPLETED';

/** En mode PER_IMPLEMENT, la charge saisie est celle d'un haltère : on en compte deux. */
export function effectiveLoadKg(weightKg: number | null | undefined, loadMode: LoadMode): number {
  if (weightKg == null) return 0;
  return loadMode === 'PER_IMPLEMENT' ? weightKg * 2 : weightKg;
}

export function setVolumeKg(set: StatsSet, loadMode: LoadMode): number {
  if (!completed(set) || set.reps == null) return 0;
  return set.reps * effectiveLoadKg(set.weightKg, loadMode);
}

export function exerciseVolumeKg(exercise: StatsExercise): number {
  if (exercise.type === 'DURATION') return 0;
  return exercise.sets.reduce((sum, s) => sum + setVolumeKg(s, exercise.loadMode), 0);
}

export const workoutVolumeKg = (w: StatsWorkout): number =>
  w.exercises.reduce((sum, e) => sum + exerciseVolumeKg(e), 0);

export const completedSets = (w: StatsWorkout): number =>
  w.exercises.reduce((sum, e) => sum + e.sets.filter(completed).length, 0);

export const completedRepetitions = (w: StatsWorkout): number =>
  w.exercises.reduce((sum, e) => sum + e.sets.filter(completed).reduce((s, set) => s + (set.reps ?? 0), 0), 0);

/** Estimation d'Epley du 1RM, uniquement de 1 à 12 répétitions avec charge. */
export function estimatedOneRepMax(weightKg: number | null | undefined, reps: number | null | undefined): number | null {
  if (weightKg == null || reps == null) return null;
  if (weightKg <= 0 || reps <= 0 || reps > MAX_REPS_FOR_ONE_REP_MAX) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function totals(workouts: StatsWorkout[]): WorkoutTotals {
  return {
    workouts: workouts.length,
    durationMs: workouts.reduce((s, w) => s + w.durationMs, 0),
    volumeKg: workouts.reduce((s, w) => s + workoutVolumeKg(w), 0),
    sets: workouts.reduce((s, w) => s + completedSets(w), 0),
    repetitions: workouts.reduce((s, w) => s + completedRepetitions(w), 0),
  };
}

const maxOf = (values: Array<number | null | undefined>): number | null => {
  const filtered = values.filter((v): v is number => v != null);
  return filtered.length ? Math.max(...filtered) : null;
};

export function performance(workout: StatsWorkout, exercise: StatsExercise): ExercisePerformance | null {
  const sets = exercise.sets.filter(completed);
  if (sets.length === 0) return null;
  const loaded = sets.filter((s) => (s.weightKg ?? 0) > 0 && (s.reps ?? 0) > 0);
  const topWeight = maxOf(loaded.map((s) => s.weightKg));
  const topWeightReps = topWeight == null
    ? null
    : Math.max(...loaded.filter((s) => s.weightKg === topWeight).map((s) => s.reps as number));
  return {
    executionId: workout.id,
    sessionName: workout.sessionName,
    date: workout.startedAt,
    exerciseRef: exercise.exerciseRef,
    exerciseName: exercise.name,
    type: exercise.type,
    loadMode: exercise.loadMode,
    sets: sets.map((s) => ({ repetitions: s.reps ?? null, weightKg: s.weightKg ?? null, durationSeconds: s.durationSeconds ?? null })),
    topWeightKg: topWeight,
    topWeightRepetitions: topWeightReps,
    estimatedOneRepMaxKg: maxOf(sets.map((s) => estimatedOneRepMax(s.weightKg, s.reps))),
    volumeKg: exerciseVolumeKg(exercise),
    totalRepetitions: sets.reduce((s, set) => s + (set.reps ?? 0), 0),
    bestDurationSeconds: maxOf(sets.map((s) => s.durationSeconds)),
    totalDurationSeconds: sets.reduce((s, set) => s + (set.durationSeconds ?? 0), 0),
  };
}

/** Identité utilisée pour regrouper l'historique d'un exercice, robuste à la suppression de l'exercice. */
export const exerciseKey = (ref: string | null | undefined, name: string): string =>
  ref ? `ref:${ref}` : `name:${name.trim().toLowerCase()}`;

export function performancesByExercise(history: StatsWorkout[]): Map<string, ExercisePerformance[]> {
  const map = new Map<string, ExercisePerformance[]>();
  for (const workout of [...history].sort((a, b) => a.startedAt - b.startedAt)) {
    for (const exercise of workout.exercises) {
      const perf = performance(workout, exercise);
      if (!perf) continue;
      const key = exerciseKey(perf.exerciseRef, perf.exerciseName);
      map.set(key, [...(map.get(key) ?? []), perf]);
    }
  }
  return map;
}
