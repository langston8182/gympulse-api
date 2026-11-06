import { Schema, model, models, Types } from 'mongoose';
import { THEME_MODES, WEIGHT_UNITS } from '../domain/constants';

export interface IPreferences {
  _id: Types.ObjectId;
  userId: string;
  onboardingCompleted: boolean;
  userName: string;
  themeMode: string;
  dynamicColor: boolean;
  weightUnit: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  keepScreenOn: boolean;
  defaultRestSeconds: number;
  weeklyGoal: number;
  autoDetectLocation: boolean;
  manualLocationRef: string | null;
}

const PreferencesSchema = new Schema<IPreferences>(
  {
    userId: { type: String, required: true, unique: true },
    onboardingCompleted: { type: Boolean, default: false },
    userName: { type: String, default: '', maxlength: 80 },
    themeMode: { type: String, enum: THEME_MODES, default: 'DARK' },
    dynamicColor: { type: Boolean, default: false },
    weightUnit: { type: String, enum: WEIGHT_UNITS, default: 'KG' },
    soundEnabled: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true },
    keepScreenOn: { type: Boolean, default: true },
    defaultRestSeconds: { type: Number, min: 0, max: 3600, default: 90 },
    weeklyGoal: { type: Number, min: 1, max: 14, default: 3 },
    autoDetectLocation: { type: Boolean, default: true },
    manualLocationRef: { type: String, default: null },
  },
  { timestamps: true, collection: 'preferences' },
);

export const PreferencesModel = models.Preferences || model<IPreferences>('Preferences', PreferencesSchema);
