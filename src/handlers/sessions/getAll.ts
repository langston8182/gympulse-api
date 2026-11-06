import { sessionToDto } from '../../mappers';
import { SessionModel } from '../../models/session.model';
import { api, ok } from '../../utils/handler';

export const handler = api(async ({ userId }) => {
  const sessions = await SessionModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  return ok(sessions.map(sessionToDto));
});
