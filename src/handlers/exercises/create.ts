import { exerciseToDto } from '../../mappers';
import { ExerciseModel } from '../../models/exercise.model';
import { api } from '../../utils/handler';
import { success } from '../../utils/response';
import { validateExercise } from '../../validators/catalog.validators';

export const handler = api(async ({ userId, body }) => {
  const data = validateExercise(body, false);
  const exercise = await ExerciseModel.create({ ...data, userId });
  return success(201, exerciseToDto(exercise.toObject()));
});
