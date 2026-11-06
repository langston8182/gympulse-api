import { LocationModel } from '../../models/location.model';
import { ProgramModel } from '../../models/program.model';
import { SessionModel } from '../../models/session.model';
import { assertProgramsExist, assertSessionsExist } from '../../services/refs';
import { api, ok, requireId } from '../../utils/handler';
import { error } from '../../utils/response';
import { Checker } from '../../utils/validation';

/** Remplace l'ensemble des éléments liés à un lieu (équivalent de linkSessions / linkPrograms côté app). */
function linkHandler(field: 'sessionRefs' | 'programRefs') {
  return api(async (ctx) => {
    const locationId = requireId(ctx);
    const c = new Checker();
    const refs = c.stringArray(ctx.body, field);
    if (!refs) c.errors[field] = 'Champ obligatoire';
    c.done();
    const wanted = refs as string[];

    const location = await LocationModel.exists({ _id: locationId, userId: ctx.userId });
    if (!location) return error(404, 'Lieu non trouvé');

    const model: any = field === 'sessionRefs' ? SessionModel : ProgramModel;
    await (field === 'sessionRefs' ? assertSessionsExist : assertProgramsExist)(ctx.userId, wanted);

    await model.updateMany({ userId: ctx.userId, _id: { $nin: wanted } }, { $pull: { locationRefs: locationId } });
    await model.updateMany({ userId: ctx.userId, _id: { $in: wanted } }, { $addToSet: { locationRefs: locationId } });
    return ok({ locationRef: locationId, [field]: wanted });
  });
}

export const linkSessions = linkHandler('sessionRefs');
export const linkPrograms = linkHandler('programRefs');
