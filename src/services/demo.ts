import { Types } from 'mongoose';
import { DEMO_LOCATIONS, DEMO_PROGRAMS, DEMO_SESSIONS } from '../domain/demoCatalog';
import { generateDemoHistory } from '../domain/demoHistory';
import { getLibraryExercise } from '../domain/library';
import { LocationModel } from '../models/location.model';
import { ProgramModel } from '../models/program.model';
import { SessionModel } from '../models/session.model';
import { WorkoutModel } from '../models/workout.model';

export async function hasDemoContent(userId: string): Promise<boolean> {
  const [s, w, l, p] = await Promise.all([
    SessionModel.exists({ userId, isDemo: true }),
    WorkoutModel.exists({ userId, isDemo: true }),
    LocationModel.exists({ userId, isDemo: true }),
    ProgramModel.exists({ userId, isDemo: true }),
  ]);
  return !!(s || w || l || p);
}

export async function deleteDemoContent(userId: string) {
  const [locations, sessions, programs, workouts] = await Promise.all([
    LocationModel.find({ userId, isDemo: true }).select('_id').lean(),
    SessionModel.find({ userId, isDemo: true }).select('_id').lean(),
    ProgramModel.find({ userId, isDemo: true }).select('_id').lean(),
    WorkoutModel.deleteMany({ userId, isDemo: true }),
  ]);
  const ids = (docs: any[]) => docs.map((d) => String(d._id));
  const locationIds = ids(locations);
  const sessionIds = ids(sessions);

  await Promise.all([
    LocationModel.deleteMany({ userId, isDemo: true }),
    SessionModel.deleteMany({ userId, isDemo: true }),
    ProgramModel.deleteMany({ userId, isDemo: true }),
  ]);
  // Les éléments de l'utilisateur ne doivent plus pointer vers du contenu supprimé.
  await Promise.all([
    SessionModel.updateMany({ userId }, { $pull: { locationRefs: { $in: locationIds } } }),
    ProgramModel.updateMany({ userId }, { $pull: { locationRefs: { $in: locationIds }, sessionRefs: { $in: sessionIds } } }),
  ]);
  return {
    locations: locationIds.length,
    sessions: sessionIds.length,
    programs: programs.length,
    workouts: workouts.deletedCount ?? 0,
  };
}

/** Remplace le contenu de démonstration de l'utilisateur (lieux, séances, programmes et ~5 mois d'historique). */
export async function seedDemoContent(userId: string, tz: string, now = Date.now()) {
  await deleteDemoContent(userId);

  const locationIds = new Map(DEMO_LOCATIONS.map((l) => [l.key, new Types.ObjectId()]));
  const sessionIds = new Map(DEMO_SESSIONS.map((s) => [s.key, new Types.ObjectId()]));
  const lref = (keys: string[]) => keys.map((k) => String(locationIds.get(k)));

  await LocationModel.insertMany(DEMO_LOCATIONS.map((l) => ({
    _id: locationIds.get(l.key), userId, isDemo: true,
    name: l.name, latitude: l.latitude, longitude: l.longitude, radiusMeters: l.radiusMeters, type: l.type, equipment: l.equipment,
  })));

  await SessionModel.insertMany(DEMO_SESSIONS.map((s) => ({
    _id: sessionIds.get(s.key), userId, isDemo: true,
    name: s.name, description: s.description, goal: s.goal, favorite: s.favorite,
    locationRefs: lref(s.locationKeys),
    exercises: s.exercises,
  })));

  await ProgramModel.insertMany(DEMO_PROGRAMS.map((p) => ({
    userId, isDemo: true,
    name: p.name, description: p.description, goal: p.goal,
    sessionRefs: p.sessionKeys.map((k) => String(sessionIds.get(k))),
    locationRefs: lref(p.locationKeys),
  })));

  const sessionsByKey = new Map(DEMO_SESSIONS.map((s) => [s.key, s]));
  const locationsByKey = new Map(DEMO_LOCATIONS.map((l) => [l.key, l]));
  const history = generateDemoHistory(now, tz);

  const workouts = history.map((w) => {
    const session = sessionsByKey.get(w.sessionKey)!;
    return {
      userId, isDemo: true, status: 'COMPLETED', active: false,
      sessionRef: String(sessionIds.get(w.sessionKey)),
      sessionName: session.name,
      goal: session.goal,
      startedAt: w.startedAt,
      endedAt: w.endedAt,
      locationRef: String(locationIds.get(w.locationKey)),
      locationName: locationsByKey.get(w.locationKey)?.name ?? null,
      notes: w.notes,
      exercises: w.exercises.map((e, i) => {
        const lib = getLibraryExercise(e.exerciseRef)!;
        return {
          key: `${e.exerciseRef}#${i}`,
          exerciseRef: e.exerciseRef,
          name: lib.name, type: lib.type, loadMode: lib.loadMode, imageUri: lib.imageUri,
          muscleGroups: lib.muscleGroups, equipment: lib.equipment,
          restSeconds: e.restSeconds, notes: '', status: 'COMPLETED',
          sets: e.sets.map((s) => ({ ...s, status: 'COMPLETED', isExtra: false })),
        };
      }),
    };
  });
  if (workouts.length) await WorkoutModel.insertMany(workouts);

  return {
    locations: DEMO_LOCATIONS.length,
    sessions: DEMO_SESSIONS.length,
    programs: DEMO_PROGRAMS.length,
    workouts: workouts.length,
  };
}
