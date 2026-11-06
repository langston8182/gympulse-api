import { programToDto } from '../../mappers';
import { ProgramModel } from '../../models/program.model';
import { assertLocationsExist, assertSessionsExist } from '../../services/refs';
import { api } from '../../utils/handler';
import { success } from '../../utils/response';
import { validateProgram } from '../../validators/catalog.validators';

export const handler = api(async ({ userId, body }) => {
  const data = validateProgram(body, false);
  await assertSessionsExist(userId, data.sessionRefs ?? []);
  await assertLocationsExist(userId, data.locationRefs ?? []);
  const program = await ProgramModel.create({ ...data, userId });
  return success(201, programToDto(program.toObject()));
});
