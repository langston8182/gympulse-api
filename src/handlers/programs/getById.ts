import { programToDto } from '../../mappers';
import { ProgramModel } from '../../models/program.model';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';

export const handler = api(async (ctx) => {
  const program = await ProgramModel.findOne({ _id: requireId(ctx), userId: ctx.userId }).lean();
  if (!program) return error(404, 'Programme non trouvé');
  return ok(programToDto(program));
});
