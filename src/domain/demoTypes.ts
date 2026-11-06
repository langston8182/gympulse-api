import { GOALS, LOCATION_TYPES } from './constants';

export type Goal = (typeof GOALS)[number];
export type LocationTypeName = (typeof LOCATION_TYPES)[number];
