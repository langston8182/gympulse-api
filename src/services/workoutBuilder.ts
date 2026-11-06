import {
  EQUIPMENT, EXERCISE_STATUSES, EXERCISE_TYPES, GOALS, LOAD_MODES, MUSCLE_GROUPS, SET_STATUSES, WORKOUT_STATUSES,
} from '../domain/constants';
import { SessionModel } from '../models/session.model';
import { LocationModel } from '../models/location.model';
import { Checker, HttpError, isValidObjectId } from '../utils/validation';
import { resolveExercises } from './refs';

type Body = Record<string, any>;

export type WorkoutMode = 'history' | 'active';

const ACTIVE_STATUSES = ['IN_PROGRESS', 'PAUSED'];

/**
 * Valide un payload de séance (historique ou en cours) et construit le document à persister.
 * Les exercices sont "photographiés" (nom, type, charge…) pour que l'historique reste exact
 * même si l'exercice ou la séance sont modifiés ou supprimés ensuite.
 */
export async function buildWorkoutFields(userId: string, body: Body, mode: WorkoutMode) {
  const c = new Checker();
  const startedAt = c.number(body, 'startedAt', { required: true, integer: true, min: 0 }) as number | undefined;
  const endedAt = c.number(body, 'endedAt', { integer: true, min: 0, nullable: true, required: mode === 'history' });
  const status = c.enum(body, 'status', WORKOUT_STATUSES) ?? (mode === 'history' ? 'COMPLETED' : 'IN_PROGRESS');

  if (mode === 'history' && !['COMPLETED', 'CANCELLED'].includes(status)) {
    c.errors.status = 'Une séance terminée est COMPLETED ou CANCELLED';
  }
  if (mode === 'active' && !ACTIVE_STATUSES.includes(status)) {
    c.errors.status = 'Une séance en cours est IN_PROGRESS ou PAUSED';
  }
  if (startedAt != null && endedAt != null && endedAt < startedAt) c.errors.endedAt = 'endedAt doit suivre startedAt';

  const sessionRef = c.string(body, 'sessionRef', { max: 64 });
  let sessionName = c.string(body, 'sessionName', { max: 120 });
  const goal = c.enum(body, 'goal', GOALS);
  const locationRef = c.string(body, 'locationRef', { max: 64 });
  let locationName = c.nullableString(body, 'locationName', 120);
  const rawExercises = c.array(body, 'exercises', { required: true, max: 100 }) ?? [];

  const parsed = rawExercises.map((item, i) => {
    const ec = c.child(`exercises[${i}].`);
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      c.errors[`exercises[${i}]`] = 'Doit être un objet';
      return null;
    }
    const rawSets = ec.array(item, 'sets', { required: true, max: 200 }) ?? [];
    const sets = rawSets.map((s, j) => {
      const sc = c.child(`exercises[${i}].sets[${j}].`);
      if (typeof s !== 'object' || s === null || Array.isArray(s)) {
        c.errors[`exercises[${i}].sets[${j}]`] = 'Doit être un objet';
        return null;
      }
      const num = (f: string, max: number) => sc.number(s, f, { min: 0, max, nullable: true }) ?? null;
      const reps = num('reps', 1000);
      const weightKg = num('weightKg', 2000);
      const durationSeconds = num('durationSeconds', 86_400);
      const completedAt = sc.number(s, 'completedAt', { integer: true, min: 0, nullable: true }) ?? null;
      const explicit = sc.enum(s, 'status', SET_STATUSES);
      const performed = completedAt != null || reps != null || durationSeconds != null;
      return {
        targetReps: num('targetReps', 1000),
        targetWeightKg: num('targetWeightKg', 2000),
        targetDurationSeconds: num('targetDurationSeconds', 86_400),
        restSeconds: (sc.number(s, 'restSeconds', { min: 0, max: 3600 }) as number | undefined) ?? 0,
        reps,
        weightKg,
        durationSeconds,
        actualRestSeconds: num('actualRestSeconds', 3600),
        status: explicit ?? (performed ? 'COMPLETED' : mode === 'history' ? 'SKIPPED' : 'PENDING'),
        completedAt,
        isExtra: sc.boolean(s, 'isExtra') ?? false,
      };
    });
    return {
      key: ec.string(item, 'key', { max: 100 }),
      exerciseRef: ec.string(item, 'exerciseRef', { max: 64 }),
      name: ec.string(item, 'name', { max: 120 }),
      type: ec.enum(item, 'type', EXERCISE_TYPES),
      loadMode: ec.enum(item, 'loadMode', LOAD_MODES),
      imageUri: ec.nullableString(item, 'imageUri', 500),
      muscleGroups: ec.enumArray(item, 'muscleGroups', MUSCLE_GROUPS),
      equipment: ec.enumArray(item, 'equipment', EQUIPMENT),
      restSeconds: (ec.number(item, 'restSeconds', { min: 0, max: 3600 }) as number | undefined) ?? 90,
      notes: ec.string(item, 'notes', { max: 2000 }) ?? '',
      status: ec.enum(item, 'status', EXERCISE_STATUSES),
      sets: sets.filter((s): s is NonNullable<typeof s> => s !== null),
    };
  });

  const state = {
    notes: c.string(body, 'notes', { max: 4000 }) ?? '',
    pausedAt: c.number(body, 'pausedAt', { integer: true, min: 0, nullable: true }),
    totalPausedMs: (c.number(body, 'totalPausedMs', { integer: true, min: 0 }) as number | undefined) ?? 0,
    currentExerciseIndex: (c.number(body, 'currentExerciseIndex', { integer: true, min: 0 }) as number | undefined) ?? 0,
    currentSetIndex: (c.number(body, 'currentSetIndex', { integer: true, min: 0 }) as number | undefined) ?? 0,
    rest: c.object(body, 'rest') ?? null,
    setTimer: c.object(body, 'setTimer') ?? null,
  };
  c.done();

  // Résolution asynchrone des références (instantané des exercices, nom de séance et de lieu).
  const refs = parsed.flatMap((e) => (e?.exerciseRef ? [e.exerciseRef] : []));
  const known = await resolveExercises(userId, refs);

  const exercises = parsed.map((e, i) => {
    const item = e as NonNullable<typeof e>;
    const ref = item.exerciseRef ?? null;
    const snap = ref ? known.get(ref) : undefined;
    const name = item.name ?? snap?.name;
    if (!name) throw new HttpError(400, 'Données invalides', { [`exercises[${i}]`]: 'Exercice inconnu : fournir exerciseRef ou name' });
    const sets = item.sets;
    const status = item.status ?? (
      sets.length > 0 && sets.every((s) => s.status === 'SKIPPED') ? 'SKIPPED'
        : sets.some((s) => s.status === 'PENDING') ? (sets.some((s) => s.status === 'COMPLETED') ? 'IN_PROGRESS' : 'PENDING')
          : 'COMPLETED'
    );
    return {
      key: item.key ?? (ref ? `${ref}#${i}` : `${name}#${i}`),
      exerciseRef: ref,
      name,
      type: item.type ?? snap?.type ?? 'REPETITIONS',
      loadMode: item.loadMode ?? snap?.loadMode ?? 'TOTAL',
      imageUri: item.imageUri ?? snap?.imageUri ?? null,
      muscleGroups: item.muscleGroups ?? snap?.muscleGroups ?? [],
      equipment: item.equipment ?? snap?.equipment ?? [],
      restSeconds: item.restSeconds,
      notes: item.notes,
      status,
      sets,
    };
  });

  if (!sessionName && sessionRef && isValidObjectId(sessionRef)) {
    const s: any = await SessionModel.findOne({ _id: sessionRef, userId }).select('name').lean();
    sessionName = s?.name;
  }
  if (!sessionName) throw new HttpError(400, 'Données invalides', { sessionName: 'Champ obligatoire (ou sessionRef valide)' });

  if (!locationName && locationRef && isValidObjectId(locationRef)) {
    const l: any = await LocationModel.findOne({ _id: locationRef, userId }).select('name').lean();
    locationName = l?.name ?? null;
  }

  return {
    sessionRef: sessionRef ?? null,
    sessionName,
    goal: goal ?? 'CUSTOM',
    status,
    active: ACTIVE_STATUSES.includes(status),
    startedAt: startedAt as number,
    endedAt: endedAt ?? null,
    locationRef: locationRef ?? null,
    locationName: locationName ?? null,
    exercises,
    ...state,
  };
}
