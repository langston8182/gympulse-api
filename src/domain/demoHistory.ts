import { DEMO_SESSIONS, DemoSession } from './demoCatalog';
import { getLibraryExercise, LibraryExercise } from './library';
import { localDateOf, mondayOnOrBefore, toEpochDay, zonedToUtc } from '../utils/time';

export interface GeneratedSet {
  targetReps?: number;
  targetWeightKg?: number | null;
  targetDurationSeconds?: number;
  restSeconds: number;
  reps?: number;
  weightKg?: number | null;
  durationSeconds?: number;
  actualRestSeconds: number | null;
  completedAt: number;
}

export interface GeneratedWorkout {
  sessionKey: string;
  startedAt: number;
  endedAt: number;
  locationKey: string;
  notes: string;
  exercises: Array<{ exerciseRef: string; restSeconds: number; sets: GeneratedSet[] }>;
}

const HISTORY_DAYS = 154;
const HYPERTROPHY_CYCLE = ['push_hyp', 'pull_hyp', 'legs_hyp'];
const STRENGTH_CYCLE = ['push_str', 'pull_str', 'legs_str'];
const NOTES = [
  "Très bonne énergie aujourd'hui.",
  'Épaule gauche un peu raide, charge prudente.',
  'Séance rapide, salle bondée.',
  'Sommeil moyen, mais séance correcte.',
  'Excellente séance, progression nette !',
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function increment(exercise: LibraryExercise): number {
  if (exercise.equipment.includes('LEG_PRESS')) return 5;
  if (exercise.loadMode === 'PER_IMPLEMENT') return 1;
  if (exercise.equipment.includes('DUMBBELL')) return 2;
  return 2.5;
}

const roundTo = (value: number, inc: number) => Math.round(value / inc) * inc;

/** ~5 mois d'historique plausible avec surcharge progressive ; déterministe pour une même graine. */
export function generateDemoHistory(now: number, tz: string, seed = 42): GeneratedWorkout[] {
  const random = mulberry32(seed);
  const nextInt = (from: number, to: number) => from + Math.floor(random() * (to - from));
  const sessions = new Map(DEMO_SESSIONS.map((s) => [s.key, s]));

  const today = toEpochDay(localDateOf(now, tz));
  const start = today - HISTORY_DAYS;
  const progress = (day: number) => Math.min(Math.max((day - start) / HISTORY_DAYS, 0), 1);

  const workouts: GeneratedWorkout[] = [];
  let hypertrophyIndex = 0;
  let strengthIndex = 0;
  let monday = mondayOnOrBefore(start);
  let week = 0;

  while (monday < today) {
    const strengthWeek = week % 3 === 2;
    const days = nextInt(0, 5) === 0 ? [0, 2, 4] : [0, 1, 3, 5];
    for (const offset of days) {
      const day = monday + offset;
      if (day < start || day >= today) continue;
      if (nextInt(0, 12) === 0) continue;
      let key: string;
      if (offset === 5 && week % 2 === 1) key = 'home_full';
      else if (strengthWeek) key = STRENGTH_CYCLE[strengthIndex++ % STRENGTH_CYCLE.length];
      else key = HYPERTROPHY_CYCLE[hypertrophyIndex++ % HYPERTROPHY_CYCLE.length];
      const session = sessions.get(key);
      if (!session) continue;
      workouts.push(buildWorkout(session, day, progress(day), key === 'home_full' ? 'home' : 'gym', tz, random, nextInt, false));
    }
    const coreDay = monday + 2;
    if (nextInt(0, 3) === 0 && coreDay >= start && coreDay < today) {
      const core = sessions.get('core_express');
      if (core) workouts.push(buildWorkout(core, coreDay, progress(coreDay), 'work', tz, random, nextInt, true));
    }
    monday += 7;
    week++;
  }
  return workouts.sort((a, b) => a.startedAt - b.startedAt);
}

function buildWorkout(
  session: DemoSession,
  day: number,
  progress: number,
  locationKey: string,
  tz: string,
  random: () => number,
  nextInt: (from: number, to: number) => number,
  lunch: boolean,
): GeneratedWorkout {
  const hour = lunch ? 12 : nextInt(0, 4) === 0 ? 7 : 18;
  const startedAt = zonedToUtc(day, tz, hour, nextInt(0, 50));
  let clock = startedAt + 4 * 60_000;
  const loadFactor = 0.8 + 0.2 * progress;

  const exercises = session.exercises.map((item, exerciseIndex) => {
    const exercise = getLibraryExercise(item.exerciseRef) as LibraryExercise;
    const timed = exercise.type === 'DURATION';
    const sets = item.sets.map((target, setIndex): GeneratedSet => {
      const rest = target.restSeconds ?? item.restSeconds;
      const isLast = exerciseIndex === session.exercises.length - 1 && setIndex === item.sets.length - 1;
      const actualRest = isLast ? null : Math.max(rest + nextInt(-10, 25), 10);
      if (timed) {
        const planned = target.durationSeconds ?? 30;
        const duration = Math.max(Math.round(planned * (0.75 + 0.25 * progress) + nextInt(-4, 8)), 10);
        clock += duration * 1000;
        const completedAt = clock;
        clock += (actualRest ?? 0) * 1000;
        return { targetDurationSeconds: planned, restSeconds: rest, durationSeconds: duration, actualRestSeconds: actualRest, completedAt };
      }
      const plannedReps = target.reps ?? 10;
      const inc = increment(exercise);
      const weight = target.weightKg != null ? Math.max(roundTo(target.weightKg * loadFactor, inc), inc) : null;
      let reps = weight == null ? Math.round(plannedReps * (0.7 + 0.3 * progress)) : plannedReps;
      if (setIndex >= item.sets.length - 2 && nextInt(0, 4) === 0) reps -= nextInt(1, 3);
      else if (nextInt(0, 8) === 0) reps += 1;
      reps = Math.max(reps, 1);
      clock += (reps * 3 + 20) * 1000;
      const completedAt = clock;
      clock += (actualRest ?? 0) * 1000;
      return { targetReps: plannedReps, targetWeightKg: weight, restSeconds: rest, reps, weightKg: weight, actualRestSeconds: actualRest, completedAt };
    });
    return { exerciseRef: item.exerciseRef, restSeconds: item.restSeconds, sets };
  });

  return {
    sessionKey: session.key,
    startedAt,
    endedAt: clock + 2 * 60_000,
    locationKey,
    notes: random() < 1 / 6 ? NOTES[Math.floor(random() * NOTES.length)] : '',
    exercises,
  };
}
