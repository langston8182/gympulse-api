import { Schema, model, models, Types } from 'mongoose';
import {
  EQUIPMENT, EXERCISE_STATUSES, EXERCISE_TYPES, GOALS, LOAD_MODES, MUSCLE_GROUPS, SET_STATUSES, WORKOUT_STATUSES,
} from '../domain/constants';

export interface IWorkoutSet {
  targetReps?: number | null;
  targetWeightKg?: number | null;
  targetDurationSeconds?: number | null;
  restSeconds: number;
  reps?: number | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
  actualRestSeconds?: number | null;
  status: string;
  completedAt?: number | null;
  isExtra: boolean;
}

export interface IWorkoutExercise {
  key: string;
  exerciseRef: string | null;
  name: string;
  type: string;
  loadMode: string;
  imageUri?: string | null;
  muscleGroups: string[];
  equipment: string[];
  restSeconds: number;
  notes: string;
  status: string;
  sets: IWorkoutSet[];
}

export interface IWorkout {
  _id: Types.ObjectId;
  userId: string;
  sessionRef: string | null;
  sessionName: string;
  goal: string;
  status: string;
  /** Vrai tant que la séance est en cours ou en pause (index unique partiel : une seule séance active par utilisateur). */
  active: boolean;
  startedAt: number;
  endedAt?: number | null;
  pausedAt?: number | null;
  totalPausedMs: number;
  locationRef: string | null;
  locationName?: string | null;
  notes: string;
  currentExerciseIndex: number;
  currentSetIndex: number;
  rest?: Record<string, unknown> | null;
  setTimer?: Record<string, unknown> | null;
  exercises: IWorkoutExercise[];
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSetSchema = new Schema<IWorkoutSet>(
  {
    targetReps: { type: Number, default: null },
    targetWeightKg: { type: Number, default: null },
    targetDurationSeconds: { type: Number, default: null },
    restSeconds: { type: Number, default: 0 },
    reps: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    durationSeconds: { type: Number, default: null },
    actualRestSeconds: { type: Number, default: null },
    status: { type: String, enum: SET_STATUSES, default: 'PENDING' },
    completedAt: { type: Number, default: null },
    isExtra: { type: Boolean, default: false },
  },
  { _id: false },
);

const WorkoutExerciseSchema = new Schema<IWorkoutExercise>(
  {
    key: { type: String, required: true },
    exerciseRef: { type: String, default: null },
    name: { type: String, required: true },
    type: { type: String, enum: EXERCISE_TYPES, default: 'REPETITIONS' },
    loadMode: { type: String, enum: LOAD_MODES, default: 'TOTAL' },
    imageUri: { type: String, default: null },
    muscleGroups: { type: [String], enum: MUSCLE_GROUPS, default: [] },
    equipment: { type: [String], enum: EQUIPMENT, default: [] },
    restSeconds: { type: Number, default: 90 },
    notes: { type: String, default: '' },
    status: { type: String, enum: EXERCISE_STATUSES, default: 'PENDING' },
    sets: { type: [WorkoutSetSchema], default: [] },
  },
  { _id: false },
);

const WorkoutSchema = new Schema<IWorkout>(
  {
    userId: { type: String, required: true },
    sessionRef: { type: String, default: null },
    sessionName: { type: String, required: true, maxlength: 120 },
    goal: { type: String, enum: GOALS, default: 'CUSTOM' },
    status: { type: String, enum: WORKOUT_STATUSES, default: 'COMPLETED' },
    active: { type: Boolean, default: false },
    startedAt: { type: Number, required: true },
    endedAt: { type: Number, default: null },
    pausedAt: { type: Number, default: null },
    totalPausedMs: { type: Number, default: 0 },
    locationRef: { type: String, default: null },
    locationName: { type: String, default: null },
    notes: { type: String, default: '', maxlength: 4000 },
    currentExerciseIndex: { type: Number, default: 0 },
    currentSetIndex: { type: Number, default: 0 },
    rest: { type: Schema.Types.Mixed, default: null },
    setTimer: { type: Schema.Types.Mixed, default: null },
    exercises: { type: [WorkoutExerciseSchema], default: [] },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'workouts', minimize: false },
);

WorkoutSchema.index({ userId: 1, status: 1, startedAt: -1 });
WorkoutSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { active: true }, name: 'one_active_per_user' });

export const WorkoutModel = models.Workout || model<IWorkout>('Workout', WorkoutSchema);
