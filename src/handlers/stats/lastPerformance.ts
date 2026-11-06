import { performancesByExercise } from '../../domain/trainingMath';
import { ExercisePerformance } from '../../domain/statsTypes';
import { toStatsWorkout } from '../../mappers';
import { WorkoutModel } from '../../models/workout.model';
import { loadHistory } from '../../services/history';
import { api, ok } from '../../utils/handler';
import { HttpError } from '../../utils/validation';

/** GET /v1/stats/last-performances — dernière performance de chaque exercice, indexée par exerciseRef. */
export const getAll = api(async ({ userId }) => {
  const history = await loadHistory(userId);
  const result: Record<string, ExercisePerformance> = {};
  for (const performances of performancesByExercise(history).values()) {
    const last = performances[performances.length - 1];
    if (last.exerciseRef) result[last.exerciseRef] = last;
  }
  return ok(result);
});

/**
 * GET /v1/stats/last-performance/{ref}?sessionRef=&excluding=
 * Dernière performance d'un exercice ; celle réalisée dans la même séance est préférée (plus comparable).
 * Répond 204 s'il n'y a aucune performance.
 */
export const getOne = api(async ({ userId, params, query }) => {
  const ref = params.ref;
  if (!ref || ref.length > 64) throw new HttpError(400, 'Référence invalide');

  const docs: any[] = await WorkoutModel.find({ userId, status: 'COMPLETED', 'exercises.exerciseRef': ref })
    .select('sessionRef sessionName startedAt endedAt totalPausedMs exercises')
    .sort({ startedAt: 1 })
    .lean();
  const eligible = docs.filter((d) => String(d._id) !== query.excluding);
  const sessionIds = new Set(eligible.filter((d) => query.sessionRef && d.sessionRef === query.sessionRef).map((d) => String(d._id)));

  const perfs = [...performancesByExercise(eligible.map(toStatsWorkout)).entries()]
    .filter(([key]) => key === `ref:${ref}`)
    .flatMap(([, list]) => list);
  const preferred = perfs.filter((p) => sessionIds.has(p.executionId));
  const last = (preferred.length ? preferred : perfs).at(-1);
  return last ? ok(last) : { statusCode: 204, body: '' };
});
