import { Equipment, MuscleGroup } from './types';
import { ExerciseType, LoadMode } from './constants';

export interface LibraryExercise {
  ref: string;
  name: string;
  type: ExerciseType;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  loadMode: LoadMode;
  imageUri: string;
  notes: string;
}

function ex(
  ref: string,
  name: string,
  muscleGroups: MuscleGroup[],
  equipment: Equipment[],
  image: string,
  opts: { type?: ExerciseType; loadMode?: LoadMode; notes?: string } = {},
): LibraryExercise {
  return {
    ref,
    name,
    type: opts.type ?? 'REPETITIONS',
    muscleGroups,
    equipment,
    loadMode: opts.loadMode ?? 'TOTAL',
    imageUri: `preset:${image}`,
    notes: opts.notes ?? '',
  };
}

const PER = { loadMode: 'PER_IMPLEMENT' } as const;

/** Bibliothèque d'exercices fournie à tous les utilisateurs (non modifiable). */
export const EXERCISE_LIBRARY: LibraryExercise[] = [
  ex('bench_db', 'Développé couché haltères', ['CHEST', 'TRICEPS', 'SHOULDERS'], ['DUMBBELL', 'BENCH'], 'bench', { ...PER, notes: "Omoplates serrées, descendre jusqu'à l'étirement des pectoraux." }),
  ex('bench_bb', 'Développé couché barre', ['CHEST', 'TRICEPS', 'SHOULDERS'], ['BARBELL', 'BENCH', 'SQUAT_RACK'], 'bench', { notes: 'Pieds ancrés, barre au niveau du bas des pectoraux.' }),
  ex('incline_db', 'Développé incliné haltères', ['CHEST', 'SHOULDERS', 'TRICEPS'], ['DUMBBELL', 'BENCH'], 'bench', PER),
  ex('cable_fly', 'Écarté à la poulie', ['CHEST'], ['CABLE'], 'cable'),
  ex('pushup', 'Pompes', ['CHEST', 'TRICEPS', 'SHOULDERS'], ['BODYWEIGHT'], 'fullbody'),
  ex('ohp_bb', 'Développé militaire barre', ['SHOULDERS', 'TRICEPS'], ['BARBELL', 'SQUAT_RACK'], 'press'),
  ex('ohp_db', 'Développé épaules haltères', ['SHOULDERS', 'TRICEPS'], ['DUMBBELL', 'BENCH'], 'press', PER),
  ex('lateral_raise', 'Élévations latérales', ['SHOULDERS'], ['DUMBBELL'], 'shoulders', { ...PER, notes: "Monter jusqu'à l'horizontale, coudes légèrement fléchis." }),
  ex('face_pull', 'Face pull', ['SHOULDERS', 'TRAPS'], ['CABLE'], 'cable'),
  ex('dips', 'Dips', ['TRICEPS', 'CHEST'], ['DIP_STATION'], 'arms', { notes: 'Charge = lest ajouté au poids du corps.' }),
  ex('triceps_pushdown', 'Extension triceps à la poulie', ['TRICEPS'], ['CABLE'], 'cable'),
  ex('skull_crusher', 'Barre au front', ['TRICEPS'], ['EZ_BAR', 'BENCH'], 'arms'),
  ex('pullup', 'Tractions', ['BACK', 'BICEPS'], ['PULL_UP_BAR'], 'pull', { notes: 'Charge = lest ajouté au poids du corps.' }),
  ex('lat_pulldown', 'Tirage vertical', ['BACK', 'BICEPS'], ['CABLE'], 'pull'),
  ex('cable_row', 'Tirage horizontal', ['BACK', 'BICEPS'], ['CABLE'], 'cable'),
  ex('row_bb', 'Rowing barre', ['BACK', 'BICEPS', 'LOWER_BACK'], ['BARBELL'], 'back'),
  ex('row_db', 'Rowing haltère unilatéral', ['BACK', 'BICEPS'], ['DUMBBELL', 'BENCH'], 'back', { notes: "Charge d'un seul haltère, répétitions par bras." }),
  ex('deadlift', 'Soulevé de terre', ['HAMSTRINGS', 'GLUTES', 'LOWER_BACK', 'BACK'], ['BARBELL'], 'legs'),
  ex('curl_db', 'Curl biceps haltères', ['BICEPS', 'FOREARMS'], ['DUMBBELL'], 'arms', PER),
  ex('curl_ez', 'Curl barre EZ', ['BICEPS'], ['EZ_BAR'], 'arms'),
  ex('hammer_curl', 'Curl marteau', ['BICEPS', 'FOREARMS'], ['DUMBBELL'], 'arms', PER),
  ex('curl_cable', 'Curl à la poulie', ['BICEPS'], ['CABLE'], 'cable'),
  ex('hammer_curl_cable', 'Curl marteau à la poulie', ['BICEPS', 'FOREARMS'], ['CABLE'], 'cable', { notes: 'Corde en prise neutre, coudes collés au corps.' }),
  ex('row_cable_knee_bench', 'Tirage un bras à la poulie, genou sur banc', ['BACK', 'BICEPS'], ['CABLE', 'BENCH'], 'cable', { notes: "Un genou et une main sur le banc, charge d'un seul bras, répétitions par bras." }),
  ex('squat_bb', 'Squat barre', ['QUADRICEPS', 'GLUTES', 'LOWER_BACK'], ['BARBELL', 'SQUAT_RACK'], 'legs', { notes: 'Descendre au moins à la parallèle, gainage maximal.' }),
  ex('goblet_squat', 'Goblet squat', ['QUADRICEPS', 'GLUTES'], ['DUMBBELL'], 'legs'),
  ex('bulgarian_split', 'Squat bulgare haltères', ['QUADRICEPS', 'GLUTES'], ['DUMBBELL', 'BENCH'], 'legs', PER),
  ex('rdl_bb', 'Soulevé de terre roumain', ['HAMSTRINGS', 'GLUTES', 'LOWER_BACK'], ['BARBELL'], 'legs'),
  ex('leg_press', 'Presse à cuisses', ['QUADRICEPS', 'GLUTES'], ['LEG_PRESS'], 'legs'),
  ex('lunges_db', 'Fentes marchées haltères', ['QUADRICEPS', 'GLUTES'], ['DUMBBELL'], 'legs', PER),
  ex('leg_curl', 'Leg curl allongé', ['HAMSTRINGS'], ['MACHINE'], 'legs'),
  ex('hip_thrust', 'Hip thrust', ['GLUTES', 'HAMSTRINGS'], ['BARBELL', 'BENCH'], 'legs'),
  ex('calf_raise', 'Mollets debout', ['CALVES'], ['MACHINE'], 'legs'),
  ex('hanging_leg_raise', 'Relevés de jambes suspendu', ['ABS'], ['PULL_UP_BAR'], 'core'),
  ex('plank', 'Gainage', ['ABS', 'LOWER_BACK'], ['MAT'], 'core', { type: 'DURATION', notes: 'Bassin neutre, fessiers et abdominaux contractés.' }),
  ex('side_plank', 'Planche latérale', ['OBLIQUES', 'ABS'], ['MAT'], 'core', { type: 'DURATION' }),
  ex('wall_sit', 'Chaise contre le mur', ['QUADRICEPS'], ['BODYWEIGHT'], 'legs', { type: 'DURATION' }),
  ex('hamstring_stretch', 'Étirement ischio-jambiers', ['HAMSTRINGS'], ['MAT'], 'stretch', { type: 'DURATION' }),
];

const BY_REF = new Map(EXERCISE_LIBRARY.map((e) => [e.ref, e]));

export function getLibraryExercise(ref: string): LibraryExercise | undefined {
  return BY_REF.get(ref);
}
