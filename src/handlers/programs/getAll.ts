import { programToDto } from '../../mappers';
import { ProgramModel } from '../../models/program.model';
import { api, ok } from '../../utils/handler';

export const handler = api(async ({ userId }) => {
  const programs = await ProgramModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  return ok(programs.map(programToDto));
});
