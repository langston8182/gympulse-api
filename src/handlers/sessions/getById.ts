import { sessionToDto } from '../../mappers';
import { SessionModel } from '../../models/session.model';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';

export const handler = api(async (ctx) => {
  const session = await SessionModel.findOne({ _id: requireId(ctx), userId: ctx.userId }).lean();
  if (!session) return error(404, 'Séance non trouvée');
  return ok(sessionToDto(session));
});
