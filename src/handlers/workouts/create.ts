import { workoutToDto } from '../../mappers';
import { WorkoutModel } from '../../models/workout.model';
import { recordsForWorkout } from '../../services/history';
import { buildWorkoutFields } from '../../services/workoutBuilder';
import { api } from '../../utils/handler';
import { success } from '../../utils/response';

/** POST /v1/workouts — enregistre directement une séance terminée (import, rattrapage, démo). */
export const handler = api(async ({ userId, body }) => {
  const fields = await buildWorkoutFields(userId, body, 'history');
  const workout = await WorkoutModel.create({ ...fields, userId });
  const doc = workout.toObject();
  const records = fields.status === 'COMPLETED' ? await recordsForWorkout(userId, doc) : [];
  return success(201, { ...workoutToDto(doc), records });
});
