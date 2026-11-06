import { ExerciseModel } from '../../models/exercise.model';
import { SessionModel } from '../../models/session.model';
import { api, requireId } from '../../utils/handler';
import { error, noContent } from '../../utils/response';

/**
 * DELETE /v1/exercises/{id}
 * Refuse (409 + nombre de séances) si l'exercice est utilisé, sauf `?force=true` qui le retire des séances.
 * L'historique n'est pas touché : il contient son propre instantané.
 */
export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const exercise = await ExerciseModel.findOne({ _id: id, userId: ctx.userId }).select('_id').lean();
  if (!exercise) return error(404, 'Exercice non trouvé');

  const usedBy = await SessionModel.countDocuments({ userId: ctx.userId, 'exercises.exerciseRef': id });
  if (usedBy > 0) {
    if (ctx.query.force !== 'true') {
      return error(409, "Exercice utilisé dans des séances", { sessionCount: usedBy });
    }
    await SessionModel.updateMany({ userId: ctx.userId }, { $pull: { exercises: { exerciseRef: id } } });
  }

  await ExerciseModel.deleteOne({ _id: id, userId: ctx.userId });
  return noContent();
});
