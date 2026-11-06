import { workoutToDto } from '../../mappers';
import { WorkoutModel } from '../../models/workout.model';
import { buildWorkoutFields } from '../../services/workoutBuilder';
import { api, ok } from '../../utils/handler';
import { noContent } from '../../utils/response';

/** GET /v1/workouts/active — séance en cours ou en pause (204 s'il n'y en a pas). */
export const getActive = api(async ({ userId }) => {
  const workout = await WorkoutModel.findOne({ userId, active: true }).lean();
  return workout ? ok(workoutToDto(workout)) : noContent();
});

/**
 * PUT /v1/workouts/active — upsert de l'état complet de la séance en cours.
 * Appelé après chaque action pour qu'une série validée ne soit jamais perdue.
 */
export const saveActive = api(async ({ userId, body }) => {
  const fields = await buildWorkoutFields(userId, body, 'active');
  const workout = await WorkoutModel.findOneAndUpdate(
    { userId, active: true },
    { $set: fields },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  return ok(workoutToDto(workout));
});

/** DELETE /v1/workouts/active — abandon de la séance en cours (idempotent). */
export const abandonActive = api(async ({ userId }) => {
  await WorkoutModel.deleteOne({ userId, active: true });
  return noContent();
});
