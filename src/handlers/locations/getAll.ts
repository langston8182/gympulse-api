import { locationToDto } from '../../mappers';
import { LocationModel } from '../../models/location.model';
import { api, ok } from '../../utils/handler';

export const handler = api(async ({ userId }) => {
  const locations = await LocationModel.find({ userId }).sort({ name: 1 }).lean();
  return ok(locations.map(locationToDto));
});
