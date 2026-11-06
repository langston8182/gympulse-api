import { WorkoutModel } from '../../models/workout.model';
import { recordsForWorkout } from '../../services/history';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';

/** GET /v1/workouts/{id}/records — records battus pendant cette séance. */
export const handler = api(async (ctx) => {
  const workout = await WorkoutModel.findOne({ _id: requireId(ctx), userId: ctx.userId, status: 'COMPLETED' }).lean();
  if (!workout) return error(404, 'Séance terminée non trouvée');
  return ok(await recordsForWorkout(ctx.userId, workout));
});
