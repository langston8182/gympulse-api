import { exerciseToDto } from '../../mappers';
import { ExerciseModel } from '../../models/exercise.model';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';

export const handler = api(async (ctx) => {
  const exercise = await ExerciseModel.findOne({ _id: requireId(ctx), userId: ctx.userId }).lean();
  if (!exercise) return error(404, 'Exercice non trouvé');
  return ok(exerciseToDto(exercise));
});
