import { sessionToDto } from '../../mappers';
import { SessionModel } from '../../models/session.model';
import { assertExercisesExist, assertLocationsExist } from '../../services/refs';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';
import { compact } from '../../utils/validation';
import { validateSession } from '../../validators/catalog.validators';

export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const data = validateSession(ctx.body, true);
  if (data.exercises) await assertExercisesExist(ctx.userId, data.exercises.map((e) => e.exerciseRef));
  if (data.locationRefs) await assertLocationsExist(ctx.userId, data.locationRefs);

  const session = await SessionModel.findOneAndUpdate(
    { _id: id, userId: ctx.userId },
    { $set: compact(data) },
    { new: true, runValidators: true },
  ).lean();
  if (!session) return error(404, 'Séance non trouvée');
  return ok(sessionToDto(session));
});
