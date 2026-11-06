import { ProgramModel } from '../../models/program.model';
import { SessionModel } from '../../models/session.model';
import { api, requireId } from '../../utils/handler';
import { error, noContent } from '../../utils/response';

/** Supprime la séance et la retire des programmes qui la référencent (l'historique reste intact). */
export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const session = await SessionModel.findOneAndDelete({ _id: id, userId: ctx.userId });
  if (!session) return error(404, 'Séance non trouvée');
  await ProgramModel.updateMany({ userId: ctx.userId }, { $pull: { sessionRefs: id } });
  return noContent();
});
