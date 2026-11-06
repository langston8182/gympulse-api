import { LocationModel } from '../../models/location.model';
import { PreferencesModel } from '../../models/preferences.model';
import { ProgramModel } from '../../models/program.model';
import { SessionModel } from '../../models/session.model';
import { api, requireId } from '../../utils/handler';
import { error, noContent } from '../../utils/response';

/** Supprime le lieu, ses liens avec séances/programmes, et le choix manuel éventuel. */
export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const location = await LocationModel.findOneAndDelete({ _id: id, userId: ctx.userId });
  if (!location) return error(404, 'Lieu non trouvé');

  await Promise.all([
    SessionModel.updateMany({ userId: ctx.userId }, { $pull: { locationRefs: id } }),
    ProgramModel.updateMany({ userId: ctx.userId }, { $pull: { locationRefs: id } }),
    PreferencesModel.updateOne({ userId: ctx.userId, manualLocationRef: id }, { $set: { manualLocationRef: null } }),
  ]);
  return noContent();
});
