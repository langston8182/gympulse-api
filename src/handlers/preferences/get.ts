import { preferencesToDto } from '../../mappers';
import { PreferencesModel } from '../../models/preferences.model';
import { api, ok } from '../../utils/handler';

/** GET /v1/preferences — valeurs par défaut si l'utilisateur n'en a pas encore. */
export const handler = api(async ({ userId }) => {
  const prefs: any = await PreferencesModel.findOne({ userId }).lean();
  return ok(preferencesToDto(prefs ?? new PreferencesModel({ userId }).toObject()));
});
