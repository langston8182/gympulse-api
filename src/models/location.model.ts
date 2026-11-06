import { Schema, model, models, Types } from 'mongoose';
import { EQUIPMENT, LOCATION_TYPES } from '../domain/constants';

export interface ILocation {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  type: string;
  equipment: string[];
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    radiusMeters: { type: Number, min: 10, max: 5000, default: 150 },
    type: { type: String, enum: LOCATION_TYPES, default: 'OTHER' },
    equipment: { type: [String], enum: EQUIPMENT, default: [] },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'locations' },
);

export const LocationModel = models.Location || model<ILocation>('Location', LocationSchema);
