import { programToDto } from '../../mappers';
import { ProgramModel } from '../../models/program.model';
import { assertLocationsExist, assertSessionsExist } from '../../services/refs';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';
import { compact } from '../../utils/validation';
import { validateProgram } from '../../validators/catalog.validators';

export const handler = api(async (ctx) => {
  const id = requireId(ctx);
  const data = validateProgram(ctx.body, true);
  if (data.sessionRefs) await assertSessionsExist(ctx.userId, data.sessionRefs);
  if (data.locationRefs) await assertLocationsExist(ctx.userId, data.locationRefs);

  const program = await ProgramModel.findOneAndUpdate(
    { _id: id, userId: ctx.userId },
    { $set: compact(data) },
    { new: true, runValidators: true },
  ).lean();
  if (!program) return error(404, 'Programme non trouvé');
  return ok(programToDto(program));
});
