import { exerciseToDto } from '../../mappers';
import { ExerciseModel } from '../../models/exercise.model';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';
import { compact } from '../../utils/validation';
import { validateExercise } from '../../validators/catalog.validators';

export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const data = validateExercise(ctx.body, true);
  const exercise = await ExerciseModel.findOneAndUpdate(
    { _id: id, userId: ctx.userId },
    { $set: compact(data) },
    { new: true, runValidators: true },
  ).lean();
  if (!exercise) return error(404, 'Exercice non trouvé');
  return ok(exerciseToDto(exercise));
});
