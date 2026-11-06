import { workoutToDto } from '../../mappers';
import { WorkoutModel } from '../../models/workout.model';
import { api, ok } from '../../utils/handler';
import { Checker } from '../../utils/validation';

/**
 * GET /v1/workouts — historique des séances terminées, plus récentes d'abord.
 * Filtres optionnels : `limit` (défaut 500, max 1000), `before` (startedAt exclusif, pour paginer), `from`, `to`.
 */
export const handler = api(async ({ userId, query }) => {
  const c = new Checker();
  const num = (field: string) => {
    if (query[field] === undefined) return undefined;
    const n = Number(query[field]);
    if (!Number.isFinite(n) || n < 0) c.errors[field] = 'Doit être un nombre positif';
    return n;
  };
  const limit = Math.min(num('limit') ?? 500, 1000);
  const before = num('before');
  const from = num('from');
  const to = num('to');
  c.done();

  const range: Record<string, number> = {};
  if (from !== undefined) range.$gte = from;
  if (to !== undefined) range.$lte = to;
  if (before !== undefined) range.$lt = before;

  const filter: Record<string, unknown> = { userId, status: 'COMPLETED' };
  if (Object.keys(range).length) filter.startedAt = range;

  const workouts = await WorkoutModel.find(filter).sort({ startedAt: -1 }).limit(limit || 500).lean();
  return ok(workouts.map(workoutToDto));
});
