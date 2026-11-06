import { Schema, model, models, Types } from 'mongoose';
import { GOALS } from '../domain/constants';

export interface IProgram {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  description: string;
  goal: string;
  sessionRefs: string[];
  locationRefs: string[];
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    goal: { type: String, enum: GOALS, default: 'HYPERTROPHY' },
    sessionRefs: { type: [String], default: [] },
    locationRefs: { type: [String], default: [] },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'programs' },
);

export const ProgramModel = models.Program || model<IProgram>('Program', ProgramSchema);
