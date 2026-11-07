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
  opts: { type?: ExerciseType; loadMode?: LoadMode; notes?: string } = {},
): LibraryExercise {
  return {
    ref,
    name,
    type: opts.type ?? 'REPETITIONS',
    muscleGroups,
    equipment,
    loadMode: opts.loadMode ?? 'TOTAL',
    imageUri: `preset:${ref}`,
    notes: opts.notes ?? '',
  };
}

const PER = { loadMode: 'PER_IMPLEMENT' } as const;

/** Bibliothèque d'exercices fournie à tous les utilisateurs (non modifiable). */
export const EXERCISE_LIBRARY: LibraryExercise[] = [
  ex('bench_db', 'Développé couché haltères', ['CHEST', 'TRICEPS', 'SHOULDERS'], ['DUMBBELL', 'BENCH'], { ...PER, notes: "Omoplates serrées, descendre jusqu'à l'étirement des pectoraux." }),
  ex('bench_bb', 'Développé couché barre', ['CHEST', 'TRICEPS', 'SHOULDERS'], ['BARBELL', 'BENCH', 'SQUAT_RACK'], { notes: 'Pieds ancrés, barre au niveau du bas des pectoraux.' }),
  ex('incline_db', 'Développé incliné haltères', ['CHEST', 'SHOULDERS', 'TRICEPS'], ['DUMBBELL', 'BENCH'], PER),
  ex('cable_fly', 'Écarté à la poulie', ['CHEST'], ['CABLE']),
  ex('pushup', 'Pompes', ['CHEST', 'TRICEPS', 'SHOULDERS'], ['BODYWEIGHT']),
  ex('ohp_bb', 'Développé militaire barre', ['SHOULDERS', 'TRICEPS'], ['BARBELL', 'SQUAT_RACK']),
  ex('ohp_db', 'Développé épaules haltères', ['SHOULDERS', 'TRICEPS'], ['DUMBBELL', 'BENCH'], PER),
  ex('lateral_raise', 'Élévations latérales', ['SHOULDERS'], ['DUMBBELL'], { ...PER, notes: "Monter jusqu'à l'horizontale, coudes légèrement fléchis." }),
  ex('rear_fly_db', 'Oiseau haltères', ['SHOULDERS', 'TRAPS', 'BACK'], ['DUMBBELL'], { ...PER, notes: 'Buste penché, dos plat : écarter les bras sur les côtés en serrant les omoplates, coudes légèrement fléchis.' }),
  ex('pullover_db', 'Pull-over haltère', ['BACK', 'CHEST', 'TRICEPS'], ['DUMBBELL', 'BENCH'], { notes: "Un seul haltère tenu à deux mains : descendre derrière la tête en gardant les bras presque tendus, puis revenir au-dessus de la poitrine." }),
  ex('face_pull', 'Face pull', ['SHOULDERS', 'TRAPS'], ['CABLE']),
  ex('butterfly', 'Butterfly (pec deck)', ['CHEST', 'SHOULDERS'], ['MACHINE'], { notes: 'Dos collé au dossier, avant-bras sur les coussins : rapprocher les bras devant la poitrine sans verrouiller les coudes.' }),
  ex('chest_press', 'Chest press (machine)', ['CHEST', 'TRICEPS', 'SHOULDERS'], ['MACHINE'], { notes: 'Dos collé au dossier, poignées au niveau des pectoraux : pousser sans verrouiller les coudes.' }),
  ex('triceps_kickback', 'Kickback triceps haltère', ['TRICEPS'], ['DUMBBELL', 'BENCH'], { notes: "Un bras à la fois, buste penché : coude collé au corps, tendre l'avant-bras vers l'arrière. Charge d'un seul haltère." }),
  ex('overhead_triceps_ext_db', 'Extension triceps au-dessus de la tête', ['TRICEPS'], ['DUMBBELL'], { notes: "Un haltère tenu à deux mains (extension nuque) : coudes serrés, descendre derrière la tête puis tendre les bras." }),
  ex('dips', 'Dips', ['TRICEPS', 'CHEST'], ['DIP_STATION'], { notes: 'Charge = lest ajouté au poids du corps.' }),
  ex('triceps_pushdown', 'Extension triceps à la poulie', ['TRICEPS'], ['CABLE']),
  ex('skull_crusher', 'Barre au front', ['TRICEPS'], ['EZ_BAR', 'BENCH']),
  ex('pullup', 'Tractions', ['BACK', 'BICEPS'], ['PULL_UP_BAR'], { notes: 'Charge = lest ajouté au poids du corps.' }),
  ex('lat_pulldown', 'Tirage vertical', ['BACK', 'BICEPS'], ['CABLE']),
  ex('cable_row', 'Tirage horizontal', ['BACK', 'BICEPS'], ['CABLE']),
  ex('row_bb', 'Rowing barre', ['BACK', 'BICEPS', 'LOWER_BACK'], ['BARBELL']),
  ex('row_db', 'Rowing haltère unilatéral', ['BACK', 'BICEPS'], ['DUMBBELL', 'BENCH'], { notes: "Charge d'un seul haltère, répétitions par bras." }),
  ex('deadlift', 'Soulevé de terre', ['HAMSTRINGS', 'GLUTES', 'LOWER_BACK', 'BACK'], ['BARBELL']),
  ex('curl_db', 'Curl biceps haltères', ['BICEPS', 'FOREARMS'], ['DUMBBELL'], PER),
  ex('curl_ez', 'Curl barre EZ', ['BICEPS'], ['EZ_BAR']),
  ex('hammer_curl', 'Curl marteau', ['BICEPS', 'FOREARMS'], ['DUMBBELL'], PER),
  ex('curl_cable', 'Curl à la poulie', ['BICEPS'], ['CABLE']),
  ex('hammer_curl_cable', 'Curl marteau à la poulie', ['BICEPS', 'FOREARMS'], ['CABLE'], { notes: 'Corde en prise neutre, coudes collés au corps.' }),
  ex('lateral_raise_cable', 'Élévation latérale à la poulie', ['SHOULDERS'], ['CABLE'], { notes: 'Poulie basse, bras opposé : monter le bras jusqu\'à l\'horizontale, coude légèrement fléchi.' }),
  ex('squat_bb', 'Squat barre', ['QUADRICEPS', 'GLUTES', 'LOWER_BACK'], ['BARBELL', 'SQUAT_RACK'], { notes: 'Descendre au moins à la parallèle, gainage maximal.' }),
  ex('goblet_squat', 'Goblet squat', ['QUADRICEPS', 'GLUTES'], ['DUMBBELL']),
  ex('bulgarian_split', 'Squat bulgare haltères', ['QUADRICEPS', 'GLUTES'], ['DUMBBELL', 'BENCH'], PER),
  ex('rdl_bb', 'Soulevé de terre roumain', ['HAMSTRINGS', 'GLUTES', 'LOWER_BACK'], ['BARBELL']),
  ex('leg_press', 'Presse à cuisses', ['QUADRICEPS', 'GLUTES'], ['LEG_PRESS']),
  ex('lunges_db', 'Fentes marchées haltères', ['QUADRICEPS', 'GLUTES'], ['DUMBBELL'], PER),
  ex('leg_curl', 'Leg curl allongé', ['HAMSTRINGS'], ['MACHINE']),
  ex('hip_thrust', 'Hip thrust', ['GLUTES', 'HAMSTRINGS'], ['BARBELL', 'BENCH']),
  ex('calf_raise', 'Mollets debout', ['CALVES'], ['MACHINE']),
  ex('hanging_leg_raise', 'Relevés de jambes suspendu', ['ABS'], ['PULL_UP_BAR']),
  ex('plank', 'Gainage', ['ABS', 'LOWER_BACK'], ['MAT'], { type: 'DURATION', notes: 'Bassin neutre, fessiers et abdominaux contractés.' }),
  ex('side_plank', 'Planche latérale', ['OBLIQUES', 'ABS'], ['MAT'], { type: 'DURATION' }),
  ex('wall_sit', 'Chaise contre le mur', ['QUADRICEPS'], ['BODYWEIGHT'], { type: 'DURATION' }),
  ex('hamstring_stretch', 'Étirement ischio-jambiers', ['HAMSTRINGS'], ['MAT'], { type: 'DURATION' }),
];

const BY_REF = new Map(EXERCISE_LIBRARY.map((e) => [e.ref, e]));

export function getLibraryExercise(ref: string): LibraryExercise | undefined {
  return BY_REF.get(ref);
}
