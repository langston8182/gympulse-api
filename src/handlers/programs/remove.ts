import { ProgramModel } from '../../models/program.model';
import { api, requireId } from '../../utils/handler';
import { error, noContent } from '../../utils/response';

export const handler = api(async (ctx) => {
  const program = await ProgramModel.findOneAndDelete({ _id: requireId(ctx), userId: ctx.userId });
  if (!program) return error(404, 'Programme non trouvé');
  return noContent();
});
