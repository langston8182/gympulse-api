import { locationToDto, programToDto, sessionToDto } from '../../mappers';
import { LocationModel } from '../../models/location.model';
import { ProgramModel } from '../../models/program.model';
import { SessionModel } from '../../models/session.model';
import { api, ok } from '../../utils/handler';

/** GET /v1/catalog — lieux, séances et programmes de l'utilisateur en un seul appel. */
export const handler = api(async ({ userId }) => {
  const [locations, sessions, programs] = await Promise.all([
    LocationModel.find({ userId }).sort({ name: 1 }).lean(),
    SessionModel.find({ userId }).sort({ updatedAt: -1 }).lean(),
    ProgramModel.find({ userId }).sort({ updatedAt: -1 }).lean(),
  ]);
  return ok({
    locations: locations.map(locationToDto),
    sessions: sessions.map(sessionToDto),
    programs: programs.map(programToDto),
  });
});
