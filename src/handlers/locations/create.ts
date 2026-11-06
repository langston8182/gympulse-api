import { locationToDto } from '../../mappers';
import { LocationModel } from '../../models/location.model';
import { api } from '../../utils/handler';
import { success } from '../../utils/response';
import { validateLocation } from '../../validators/catalog.validators';

export const handler = api(async ({ userId, body }) => {
  const data = validateLocation(body, false);
  const location = await LocationModel.create({ ...data, userId });
  return success(201, locationToDto(location.toObject()));
});
