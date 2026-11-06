import { locationToDto } from '../../mappers';
import { LocationModel } from '../../models/location.model';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';
import { compact } from '../../utils/validation';
import { validateLocation } from '../../validators/catalog.validators';

export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const data = validateLocation(ctx.body, true);
  const location = await LocationModel.findOneAndUpdate(
    { _id: id, userId: ctx.userId },
    { $set: compact(data) },
    { new: true, runValidators: true },
  ).lean();
  if (!location) return error(404, 'Lieu non trouvé');
  return ok(locationToDto(location));
});
