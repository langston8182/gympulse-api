import {
  EQUIPMENT, EXERCISE_TYPES, GOALS, LOAD_MODES, LOCATION_TYPES, MUSCLE_GROUPS, THEME_MODES, WEIGHT_UNITS,
} from '../domain/constants';
import { Checker } from '../utils/validation';

type Body = Record<string, any>;

export function validateExercise(body: Body, partial: boolean) {
  const c = new Checker();
  const data = {
    name: c.string(body, 'name', { required: !partial, min: 1, max: 120 }),
    type: c.enum(body, 'type', EXERCISE_TYPES),
    muscleGroups: c.enumArray(body, 'muscleGroups', MUSCLE_GROUPS),
    equipment: c.enumArray(body, 'equipment', EQUIPMENT),
    loadMode: c.enum(body, 'loadMode', LOAD_MODES),
    imageUri: c.nullableString(body, 'imageUri', 500),
    notes: c.string(body, 'notes', { max: 2000 }),
  };
  c.done();
  return data;
}

function validateSets(c: Checker, raw: any[], path: string) {
  return raw.map((set, i) => {
    const sc = c.child(`${path}[${i}].`);
    if (typeof set !== 'object' || set === null || Array.isArray(set)) {
      c.errors[`${path}[${i}]`] = 'Doit être un objet';
      return {};
    }
    return {
      reps: sc.number(set, 'reps', { integer: true, min: 1, max: 1000, nullable: true }) ?? null,
      weightKg: sc.number(set, 'weightKg', { min: 0, max: 2000, nullable: true }) ?? null,
      durationSeconds: sc.number(set, 'durationSeconds', { integer: true, min: 1, max: 86_400, nullable: true }) ?? null,
      restSeconds: sc.number(set, 'restSeconds', { integer: true, min: 0, max: 3600, nullable: true }) ?? null,
    };
  });
}

export function validateSession(body: Body, partial: boolean) {
  const c = new Checker();
  const rawExercises = c.array(body, 'exercises', { max: 100 });
  const exercises = rawExercises?.map((item, i) => {
    const ec = c.child(`exercises[${i}].`);
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      c.errors[`exercises[${i}]`] = 'Doit être un objet';
      return null;
    }
    const sets = ec.array(item, 'sets', { required: true, max: 100 }) ?? [];
    return {
      exerciseRef: ec.string(item, 'exerciseRef', { required: true, max: 64 }) as string,
      restSeconds: (ec.number(item, 'restSeconds', { required: true, integer: true, min: 0, max: 3600 }) ?? 0) as number,
      sets: validateSets(c, sets, `exercises[${i}].sets`),
      notes: ec.string(item, 'notes', { max: 2000 }) ?? '',
    };
  });
  const data = {
    name: c.string(body, 'name', { required: !partial, min: 1, max: 120 }),
    description: c.string(body, 'description', { max: 2000 }),
    goal: c.enum(body, 'goal', GOALS),
    exercises: exercises?.filter((e): e is NonNullable<typeof e> => e !== null),
    locationRefs: c.stringArray(body, 'locationRefs'),
    favorite: c.boolean(body, 'favorite'),
    order: c.number(body, 'order', { integer: true, min: 0, max: 1_000_000 }) as number | undefined,
  };
  c.done();
  return data;
}

export function validateProgram(body: Body, partial: boolean) {
  const c = new Checker();
  const data = {
    name: c.string(body, 'name', { required: !partial, min: 1, max: 120 }),
    description: c.string(body, 'description', { max: 2000 }),
    goal: c.enum(body, 'goal', GOALS),
    sessionRefs: c.stringArray(body, 'sessionRefs', 100),
    locationRefs: c.stringArray(body, 'locationRefs'),
  };
  c.done();
  return data;
}

export function validateLocation(body: Body, partial: boolean) {
  const c = new Checker();
  const data = {
    name: c.string(body, 'name', { required: !partial, min: 1, max: 120 }),
    address: c.string(body, 'address', { max: 300 }),
    latitude: c.number(body, 'latitude', { min: -90, max: 90, nullable: true }),
    longitude: c.number(body, 'longitude', { min: -180, max: 180, nullable: true }),
    radiusMeters: c.number(body, 'radiusMeters', { integer: true, min: 10, max: 5000 }) as number | undefined,
    type: c.enum(body, 'type', LOCATION_TYPES),
    equipment: c.enumArray(body, 'equipment', EQUIPMENT),
  };
  if ((data.latitude == null) !== (data.longitude == null) && 'latitude' in body && 'longitude' in body) {
    c.errors.latitude = 'La latitude et la longitude vont ensemble';
  }
  c.done();
  return data;
}

export function validatePreferences(body: Body) {
  const c = new Checker();
  const data = {
    onboardingCompleted: c.boolean(body, 'onboardingCompleted'),
    userName: c.string(body, 'userName', { max: 80 }),
    themeMode: c.enum(body, 'themeMode', THEME_MODES),
    dynamicColor: c.boolean(body, 'dynamicColor'),
    weightUnit: c.enum(body, 'weightUnit', WEIGHT_UNITS),
    soundEnabled: c.boolean(body, 'soundEnabled'),
    vibrationEnabled: c.boolean(body, 'vibrationEnabled'),
    keepScreenOn: c.boolean(body, 'keepScreenOn'),
    defaultRestSeconds: c.number(body, 'defaultRestSeconds', { integer: true, min: 0, max: 3600 }) as number | undefined,
    weeklyGoal: c.number(body, 'weeklyGoal', { integer: true, min: 1, max: 14 }) as number | undefined,
    autoDetectLocation: c.boolean(body, 'autoDetectLocation'),
    manualLocationRef: c.nullableString(body, 'manualLocationRef', 64),
  };
  c.done();
  return data;
}
