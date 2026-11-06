import { WorkoutModel } from '../../models/workout.model';
import { api, requireId } from '../../utils/handler';
import { error, noContent } from '../../utils/response';

export const handler = api(async (ctx) => {
  const workout = await WorkoutModel.findOneAndDelete({ _id: requireId(ctx), userId: ctx.userId });
  if (!workout) return error(404, 'Séance non trouvée');
  return noContent();
});
