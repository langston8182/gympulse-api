import { preferencesToDto } from '../../mappers';
import { PreferencesModel } from '../../models/preferences.model';
import { assertLocationsExist } from '../../services/refs';
import { api, ok } from '../../utils/handler';
import { compact } from '../../utils/validation';
import { validatePreferences } from '../../validators/catalog.validators';

/** PUT /v1/preferences — mise à jour partielle (upsert). */
export const handler = api(async ({ userId, body }) => {
  const data = validatePreferences(body);
  if (data.manualLocationRef) await assertLocationsExist(userId, [data.manualLocationRef]);
  const prefs = await PreferencesModel.findOneAndUpdate(
    { userId },
    { $set: compact(data) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  return ok(preferencesToDto(prefs));
});
