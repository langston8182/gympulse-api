import { workoutToDto } from '../../mappers';
import { WorkoutModel } from '../../models/workout.model';
import { buildWorkoutFields } from '../../services/workoutBuilder';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';

/** PUT /v1/workouts/{id} — corrige une séance de l'historique (remplacement complet). */
export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const existing: any = await WorkoutModel.findOne({ _id: id, userId: ctx.userId }).select('active').lean();
  if (!existing) return error(404, 'Séance non trouvée');
  if (existing.active) return error(409, "Séance en cours : utiliser PUT /v1/workouts/active");

  const fields = await buildWorkoutFields(ctx.userId, ctx.body, 'history');
  const workout = await WorkoutModel.findOneAndUpdate(
    { _id: id, userId: ctx.userId },
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();
  return ok(workoutToDto(workout));
});
