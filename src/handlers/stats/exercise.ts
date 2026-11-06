import { exerciseProgress } from '../../domain/statsCalculator';
import { loadHistory } from '../../services/history';
import { parsePeriod, parseTimezone } from '../../services/params';
import { api, ok } from '../../utils/handler';
import { HttpError } from '../../utils/validation';

/** GET /v1/stats/exercises/{ref}?period=&tz= — progression complète d'un exercice. */
export const handler = api(async ({ userId, params, query }) => {
  const ref = params.ref;
  if (!ref || ref.length > 64) throw new HttpError(400, 'Référence invalide');
  const period = parsePeriod(query.period);
  const tz = parseTimezone(query.tz);
  const history = await loadHistory(userId);
  return ok(exerciseProgress(ref, history, period, Date.now(), tz));
});
