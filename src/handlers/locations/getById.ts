import { locationToDto } from '../../mappers';
import { LocationModel } from '../../models/location.model';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';

export const handler = api(async (ctx) => {
  const location = await LocationModel.findOne({ _id: requireId(ctx), userId: ctx.userId }).lean();
  if (!location) return error(404, 'Lieu non trouvé');
  return ok(locationToDto(location));
});
