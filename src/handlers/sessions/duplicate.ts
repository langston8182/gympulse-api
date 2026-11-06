import { sessionToDto } from '../../mappers';
import { SessionModel } from '../../models/session.model';
import { api, requireId } from '../../utils/handler';
import { error, success } from '../../utils/response';
import { Checker } from '../../utils/validation';

/** POST /v1/sessions/{id}/duplicate — body optionnel : { name }. */
export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const c = new Checker();
  const newName = c.string(ctx.body, 'name', { min: 1, max: 120 });
  c.done();

  const source: any = await SessionModel.findOne({ _id: id, userId: ctx.userId }).lean();
  if (!source) return error(404, 'Séance non trouvée');

  const copy = await SessionModel.create({
    userId: ctx.userId,
    name: newName ?? `${source.name} (copie)`.slice(0, 120),
    description: source.description,
    goal: source.goal,
    exercises: source.exercises,
    locationRefs: source.locationRefs,
    favorite: false,
    isDemo: false,
  });
  return success(201, sessionToDto(copy.toObject()));
});
