import { workoutToDto } from '../../mappers';
import { WorkoutModel } from '../../models/workout.model';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';

export const handler = api(async (ctx) => {
  const workout = await WorkoutModel.findOne({ _id: requireId(ctx), userId: ctx.userId }).lean();
  if (!workout) return error(404, 'Séance non trouvée');
  return ok(workoutToDto(workout));
});
