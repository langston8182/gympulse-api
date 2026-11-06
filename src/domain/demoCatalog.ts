import { Equipment } from './types';
import { Goal, LocationTypeName } from './demoTypes';

export interface DemoSet {
  reps?: number | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
  restSeconds?: number | null;
}

export interface DemoSessionExercise {
  exerciseRef: string;
  restSeconds: number;
  sets: DemoSet[];
  notes: string;
}

export interface DemoSession {
  key: string;
  name: string;
  description: string;
  goal: Goal;
  favorite: boolean;
  locationKeys: string[];
  exercises: DemoSessionExercise[];
}

export interface DemoProgram {
  key: string;
  name: string;
  description: string;
  goal: Goal;
  sessionKeys: string[];
  locationKeys: string[];
}

export interface DemoLocation {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: LocationTypeName;
  equipment: Equipment[];
}

const reps = (...pairs: Array<[number, number | null]>): DemoSet[] =>
  pairs.map(([r, w]) => ({ reps: r, weightKg: w }));
const same = (count: number, r: number, weightKg: number | null): DemoSet[] =>
  Array.from({ length: count }, () => ({ reps: r, weightKg }));
const timed = (count: number, seconds: number): DemoSet[] =>
  Array.from({ length: count }, () => ({ durationSeconds: seconds }));
const item = (exerciseRef: string, restSeconds: number, sets: DemoSet[], notes = ''): DemoSessionExercise => ({
  exerciseRef, restSeconds, sets, notes,
});

export const DEMO_SESSIONS: DemoSession[] = [
  {
    key: 'push_hyp', name: 'Push — Hypertrophie', goal: 'HYPERTROPHY', favorite: true,
    description: 'Pectoraux, épaules et triceps. Volume modéré à élevé, tempo contrôlé.',
    locationKeys: ['gym'],
    exercises: [
      item('bench_db', 120, reps([12, 20], [8, 24], [5, 28], [5, 32]), 'Pyramide montante'),
      item('incline_db', 90, same(3, 10, 22)),
      item('ohp_db', 90, same(3, 10, 18)),
      item('lateral_raise', 60, same(3, 15, 9)),
      item('triceps_pushdown', 60, same(3, 12, 27.5)),
      item('dips', 90, same(3, 12, null)),
    ],
  },
  {
    key: 'pull_hyp', name: 'Pull — Hypertrophie', goal: 'HYPERTROPHY', favorite: false,
    description: 'Dos et biceps : tirages verticaux et horizontaux.',
    locationKeys: ['gym'],
    exercises: [
      item('lat_pulldown', 90, same(4, 10, 60)),
      item('cable_row', 90, same(3, 10, 55)),
      item('row_db', 90, same(3, 10, 30)),
      item('face_pull', 60, same(3, 15, 22.5)),
      item('curl_db', 60, same(3, 12, 13)),
      item('hammer_curl', 60, same(3, 10, 15)),
    ],
  },
  {
    key: 'legs_hyp', name: 'Legs — Hypertrophie', goal: 'HYPERTROPHY', favorite: false,
    description: 'Quadriceps, ischio-jambiers, fessiers et mollets.',
    locationKeys: ['gym'],
    exercises: [
      item('squat_bb', 150, same(4, 10, 75)),
      item('leg_press', 120, same(3, 12, 150)),
      item('rdl_bb', 120, same(3, 10, 75)),
      item('leg_curl', 60, same(3, 12, 42.5)),
      item('calf_raise', 60, same(4, 15, 65)),
      item('plank', 60, timed(3, 45)),
    ],
  },
  {
    key: 'push_str', name: 'Push — Force', goal: 'STRENGTH', favorite: false,
    description: 'Mouvements lourds de poussée, séries courtes et longs repos.',
    locationKeys: ['gym'],
    exercises: [
      item('bench_bb', 180, same(5, 5, 85)),
      item('ohp_bb', 180, same(4, 5, 50)),
      item('dips', 120, same(3, 6, 15)),
      item('skull_crusher', 90, same(3, 8, 32.5)),
    ],
  },
  {
    key: 'pull_str', name: 'Pull — Force', goal: 'STRENGTH', favorite: false,
    description: 'Soulevé de terre, tractions lestées et rowing lourd.',
    locationKeys: ['gym'],
    exercises: [
      item('deadlift', 210, same(4, 4, 130)),
      item('pullup', 150, same(5, 5, 10)),
      item('row_bb', 150, same(4, 6, 75)),
      item('curl_ez', 90, same(3, 8, 32.5)),
    ],
  },
  {
    key: 'legs_str', name: 'Legs — Force', goal: 'STRENGTH', favorite: false,
    description: 'Squat lourd et chaîne postérieure.',
    locationKeys: ['gym'],
    exercises: [
      item('squat_bb', 210, same(5, 5, 105)),
      item('rdl_bb', 150, same(4, 6, 95)),
      item('hip_thrust', 120, same(3, 8, 110)),
      item('calf_raise', 60, same(3, 10, 85)),
    ],
  },
  {
    key: 'home_full', name: 'Full body maison', goal: 'HYPERTROPHY', favorite: true,
    description: 'Séance complète avec haltères, banc et poids du corps.',
    locationKeys: ['home'],
    exercises: [
      item('goblet_squat', 90, same(4, 12, 26)),
      item('bench_db', 90, same(4, 10, 24)),
      item('row_db', 90, same(4, 12, 26)),
      item('bulgarian_split', 90, same(3, 10, 14)),
      item('pushup', 60, same(3, 15, null)),
      item('plank', 45, timed(3, 60)),
    ],
  },
  {
    key: 'core_express', name: 'Gainage express', goal: 'ENDURANCE', favorite: false,
    description: '15 minutes de gainage et de mobilité, faisable partout.',
    locationKeys: ['home', 'work'],
    exercises: [
      item('plank', 30, timed(3, 60)),
      item('side_plank', 30, timed(4, 40), 'Alterner les côtés'),
      item('wall_sit', 45, timed(3, 50)),
      item('hamstring_stretch', 15, timed(2, 45)),
    ],
  },
];

export const DEMO_PROGRAMS: DemoProgram[] = [
  {
    key: 'ppl_hyp', name: 'Programme Hypertrophie', goal: 'HYPERTROPHY',
    description: 'Push / Pull / Legs orienté prise de muscle, 3 à 4 séances par semaine.',
    sessionKeys: ['push_hyp', 'pull_hyp', 'legs_hyp'], locationKeys: ['gym'],
  },
  {
    key: 'ppl_str', name: 'Programme Force', goal: 'STRENGTH',
    description: 'Push / Pull / Legs lourd pour développer la force maximale.',
    sessionKeys: ['push_str', 'pull_str', 'legs_str'], locationKeys: ['gym'],
  },
];

export const DEMO_LOCATIONS: DemoLocation[] = [
  {
    key: 'home', name: 'Maison', latitude: 48.859, longitude: 2.347, radiusMeters: 120, type: 'HOME',
    equipment: ['BODYWEIGHT', 'DUMBBELL', 'BENCH', 'PULL_UP_BAR', 'RESISTANCE_BAND', 'MAT', 'KETTLEBELL'],
  },
  {
    key: 'gym', name: 'Salle de sport', latitude: 48.853, longitude: 2.369, radiusMeters: 150, type: 'GYM',
    equipment: [
      'BODYWEIGHT', 'DUMBBELL', 'BARBELL', 'EZ_BAR', 'KETTLEBELL', 'BENCH', 'SQUAT_RACK', 'SMITH_MACHINE',
      'CABLE', 'MACHINE', 'LEG_PRESS', 'PULL_UP_BAR', 'DIP_STATION', 'MAT',
    ],
  },
  {
    key: 'work', name: 'Bureau', latitude: 48.8738, longitude: 2.295, radiusMeters: 200, type: 'WORK',
    equipment: ['BODYWEIGHT', 'MAT', 'RESISTANCE_BAND'],
  },
];
