import { ExerciseModel } from '../models/exercise.model';
import { LocationModel } from '../models/location.model';
import { PreferencesModel } from '../models/preferences.model';
import { ProgramModel } from '../models/program.model';
import { SessionModel } from '../models/session.model';
import { WorkoutModel } from '../models/workout.model';

/** Supprime toutes les données d'un utilisateur et renvoie le nombre de documents supprimés par collection. */
export async function deleteAccountData(userId: string) {
  const [exercises, sessions, programs, locations, workouts, preferences] = await Promise.all([
    ExerciseModel.deleteMany({ userId }),
    SessionModel.deleteMany({ userId }),
    ProgramModel.deleteMany({ userId }),
    LocationModel.deleteMany({ userId }),
    WorkoutModel.deleteMany({ userId }),
    PreferencesModel.deleteMany({ userId }),
  ]);
  return {
    exercises: exercises.deletedCount,
    sessions: sessions.deletedCount,
    programs: programs.deletedCount,
    locations: locations.deletedCount,
    workouts: workouts.deletedCount,
    preferences: preferences.deletedCount,
  };
}
