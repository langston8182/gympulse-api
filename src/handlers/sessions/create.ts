import { sessionToDto } from '../../mappers';
import { SessionModel } from '../../models/session.model';
import { assertExercisesExist, assertLocationsExist } from '../../services/refs';
import { api } from '../../utils/handler';
import { success } from '../../utils/response';
import { validateSession } from '../../validators/catalog.validators';

export const handler = api(async ({ userId, body }) => {
  const data = validateSession(body, false);
  await assertExercisesExist(userId, (data.exercises ?? []).map((e) => e.exerciseRef));
  await assertLocationsExist(userId, data.locationRefs ?? []);
  const session = await SessionModel.create({ ...data, userId });
  return success(201, sessionToDto(session.toObject()));
});
