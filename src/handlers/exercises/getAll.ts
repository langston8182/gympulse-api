import { exerciseToDto } from '../../mappers';
import { ExerciseModel } from '../../models/exercise.model';
import { api, ok } from '../../utils/handler';

export const handler = api(async ({ userId }) => {
  const exercises = await ExerciseModel.find({ userId }).sort({ name: 1 }).lean();
  return ok(exercises.map(exerciseToDto));
});
