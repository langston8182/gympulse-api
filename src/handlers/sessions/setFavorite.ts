import { sessionToDto } from '../../mappers';
import { SessionModel } from '../../models/session.model';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';
import { Checker } from '../../utils/validation';

/** PUT /v1/sessions/{id}/favorite — body : { favorite: boolean }. */
export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const c = new Checker();
  const favorite = c.boolean(ctx.body, 'favorite');
  if (favorite === undefined) c.errors.favorite = 'Champ obligatoire';
  c.done();

  const session = await SessionModel.findOneAndUpdate(
    { _id: id, userId: ctx.userId },
    { $set: { favorite } },
    { new: true },
  ).lean();
  if (!session) return error(404, 'Séance non trouvée');
  return ok(sessionToDto(session));
});
