import { ExerciseType, LoadMode } from './constants';
import { MuscleGroup } from './types';

export interface StatsSet {
  status: string;
  reps?: number | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
}

export interface StatsExercise {
  exerciseRef: string | null;
  name: string;
  type: ExerciseType;
  loadMode: LoadMode;
  muscleGroups: MuscleGroup[];
  sets: StatsSet[];
}

/** Séance terminée, réduite à ce qu'il faut pour calculer les statistiques. */
export interface StatsWorkout {
  id: string;
  sessionName: string;
  startedAt: number;
  durationMs: number;
  exercises: StatsExercise[];
}

export interface PerformedSet {
  repetitions: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
}

export interface ExercisePerformance {
  executionId: string;
  sessionName: string;
  date: number;
  exerciseRef: string | null;
  exerciseName: string;
  type: ExerciseType;
  loadMode: LoadMode;
  sets: PerformedSet[];
  topWeightKg: number | null;
  topWeightRepetitions: number | null;
  estimatedOneRepMaxKg: number | null;
  volumeKg: number;
  totalRepetitions: number;
  bestDurationSeconds: number | null;
  totalDurationSeconds: number;
}

export type RecordType =
  | 'MAX_WEIGHT' | 'ESTIMATED_ONE_REP_MAX' | 'BEST_SET_VOLUME' | 'SESSION_VOLUME' | 'MAX_REPETITIONS' | 'MAX_DURATION';

export interface PersonalRecord {
  exerciseRef: string | null;
  exerciseName: string;
  type: RecordType;
  value: number;
  previousValue: number | null;
  repetitions: number | null;
  weightKg: number | null;
  achievedAt: number;
  executionId: string;
}

export interface WorkoutTotals {
  workouts: number;
  durationMs: number;
  volumeKg: number;
  sets: number;
  repetitions: number;
}
