export const EXERCISE_TYPES = ['REPETITIONS', 'DURATION'] as const;
export const LOAD_MODES = ['TOTAL', 'PER_IMPLEMENT'] as const;
export const MUSCLE_GROUPS = [
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'TRAPS', 'LOWER_BACK',
  'ABS', 'OBLIQUES', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ADDUCTORS', 'FULL_BODY',
] as const;
export const EQUIPMENT = [
  'BODYWEIGHT', 'DUMBBELL', 'BARBELL', 'EZ_BAR', 'KETTLEBELL', 'BENCH', 'SQUAT_RACK', 'SMITH_MACHINE',
  'CABLE', 'MACHINE', 'LEG_PRESS', 'PULL_UP_BAR', 'DIP_STATION', 'RESISTANCE_BAND', 'MAT',
] as const;
export const GOALS = ['HYPERTROPHY', 'STRENGTH', 'ENDURANCE', 'CUSTOM'] as const;
export const LOCATION_TYPES = ['HOME', 'GYM', 'WORK', 'OTHER'] as const;
export const WORKOUT_STATUSES = ['IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;
export const EXERCISE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] as const;
export const SET_STATUSES = ['PENDING', 'COMPLETED', 'SKIPPED'] as const;
export const THEME_MODES = ['SYSTEM', 'DARK', 'LIGHT'] as const;
export const WEIGHT_UNITS = ['KG', 'LB'] as const;

export const STATS_PERIODS = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 91,
  HALF_YEAR: 182,
  YEAR: 365,
  ALL: null,
} as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];
export type LoadMode = (typeof LOAD_MODES)[number];
export type Goal = (typeof GOALS)[number];
export type WorkoutStatus = (typeof WORKOUT_STATUSES)[number];
export type SetStatus = (typeof SET_STATUSES)[number];
export type ExerciseStatus = (typeof EXERCISE_STATUSES)[number];
export type StatsPeriod = keyof typeof STATS_PERIODS;

export const DEFAULT_TIMEZONE = 'Europe/Paris';
