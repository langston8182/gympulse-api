import { Schema, model, models, Types } from 'mongoose';
import { EQUIPMENT, EXERCISE_TYPES, LOAD_MODES, MUSCLE_GROUPS } from '../domain/constants';

export interface IExercise {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  type: string;
  muscleGroups: string[];
  equipment: string[];
  loadMode: string;
  imageUri?: string | null;
  notes: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    type: { type: String, enum: EXERCISE_TYPES, default: 'REPETITIONS' },
    muscleGroups: { type: [String], enum: MUSCLE_GROUPS, default: [] },
    equipment: { type: [String], enum: EQUIPMENT, default: [] },
    loadMode: { type: String, enum: LOAD_MODES, default: 'TOTAL' },
    imageUri: { type: String, maxlength: 500, default: null },
    notes: { type: String, maxlength: 2000, default: '' },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'exercises' },
);

export const ExerciseModel = models.Exercise || model<IExercise>('Exercise', ExerciseSchema);
