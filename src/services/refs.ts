import { getLibraryExercise } from '../domain/library';
import { ExerciseModel } from '../models/exercise.model';
import { LocationModel } from '../models/location.model';
import { ProgramModel } from '../models/program.model';
import { SessionModel } from '../models/session.model';
import { HttpError, isValidObjectId } from '../utils/validation';

export interface ExerciseSnapshot {
  name: string;
  type: string;
  loadMode: string;
  imageUri: string | null;
  muscleGroups: string[];
  equipment: string[];
}

/** Résout des références d'exercices : bibliothèque (clés textuelles) ou exercices de l'utilisateur (ObjectId). */
export async function resolveExercises(userId: string, refs: string[]): Promise<Map<string, ExerciseSnapshot>> {
  const out = new Map<string, ExerciseSnapshot>();
  const custom: string[] = [];
  for (const ref of new Set(refs)) {
    const lib = getLibraryExercise(ref);
    if (lib) out.set(ref, lib);
    else if (isValidObjectId(ref)) custom.push(ref);
  }
  if (custom.length) {
    const docs: any[] = await ExerciseModel.find({ _id: { $in: custom }, userId }).lean();
    for (const d of docs) {
      out.set(String(d._id), {
        name: d.name, type: d.type, loadMode: d.loadMode, imageUri: d.imageUri ?? null,
        muscleGroups: d.muscleGroups ?? [], equipment: d.equipment ?? [],
      });
    }
  }
  return out;
}

export async function assertExercisesExist(userId: string, refs: string[]): Promise<void> {
  const known = await resolveExercises(userId, refs);
  const missing = [...new Set(refs)].filter((r) => !known.has(r));
  if (missing.length) throw new HttpError(400, 'Exercices inconnus', { exerciseRef: missing });
}

async function assertOwned(model: any, label: string, userId: string, refs: string[]): Promise<void> {
  const unique = [...new Set(refs)];
  if (!unique.length) return;
  const invalid = unique.filter((r) => !isValidObjectId(r));
  const found: any[] = invalid.length ? [] : await model.find({ _id: { $in: unique }, userId }).select('_id').lean();
  const foundIds = new Set(found.map((d) => String(d._id)));
  const missing = unique.filter((r) => !foundIds.has(r));
  if (missing.length) throw new HttpError(400, `${label} inconnus`, { refs: missing });
}

export const assertLocationsExist = (userId: string, refs: string[]) => assertOwned(LocationModel, 'Lieux', userId, refs);
export const assertSessionsExist = (userId: string, refs: string[]) => assertOwned(SessionModel, 'Séances', userId, refs);
export const assertProgramsExist = (userId: string, refs: string[]) => assertOwned(ProgramModel, 'Programmes', userId, refs);
