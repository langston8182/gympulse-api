import { dashboard } from '../../domain/statsCalculator';
import { workoutToDto } from '../../mappers';
import { WorkoutModel } from '../../models/workout.model';
import { loadHistory } from '../../services/history';
import { parsePeriod, parseTimezone } from '../../services/params';
import { api, ok } from '../../utils/handler';

/** GET /v1/stats/dashboard?period=WEEK|MONTH|QUARTER|HALF_YEAR|YEAR|ALL&tz=Europe/Paris */
export const handler = api(async ({ userId, query }) => {
  const period = parsePeriod(query.period);
  const tz = parseTimezone(query.tz);
  const history = await loadHistory(userId);
  const stats = dashboard(history, period, Date.now(), tz);

  const { lastWorkoutId, ...rest } = stats;
  const last = lastWorkoutId ? await WorkoutModel.findOne({ _id: lastWorkoutId, userId }).lean() : null;
  return ok({ ...rest, lastWorkout: last ? workoutToDto(last) : null });
});
