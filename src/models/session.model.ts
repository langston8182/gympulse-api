import { Schema, model, models, Types } from 'mongoose';
import { GOALS } from '../domain/constants';

export interface ISetTarget {
  reps?: number | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
  restSeconds?: number | null;
}

export interface ISessionExercise {
  exerciseRef: string;
  restSeconds: number;
  sets: ISetTarget[];
  notes: string;
}

export interface ISession {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  description: string;
  goal: string;
  exercises: ISessionExercise[];
  locationRefs: string[];
  favorite: boolean;
  order: number;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SetTargetSchema = new Schema<ISetTarget>(
  {
    reps: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    durationSeconds: { type: Number, default: null },
    restSeconds: { type: Number, default: null },
  },
  { _id: false },
);

const SessionExerciseSchema = new Schema<ISessionExercise>(
  {
    exerciseRef: { type: String, required: true },
    restSeconds: { type: Number, required: true },
    sets: { type: [SetTargetSchema], default: [] },
    notes: { type: String, default: '', maxlength: 2000 },
  },
  { _id: false },
);

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    goal: { type: String, enum: GOALS, default: 'HYPERTROPHY' },
    exercises: { type: [SessionExerciseSchema], default: [] },
    locationRefs: { type: [String], default: [] },
    favorite: { type: Boolean, default: false },
    order: { type: Number, default: 0, min: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'sessions' },
);

export const SessionModel = models.Session || model<ISession>('Session', SessionSchema);
