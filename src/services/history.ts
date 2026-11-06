import { detectForWorkout } from '../domain/records';
import { StatsWorkout } from '../domain/statsTypes';
import { toStatsWorkout } from '../mappers';
import { WorkoutModel } from '../models/workout.model';

export async function loadHistory(userId: string): Promise<StatsWorkout[]> {
  const docs = await WorkoutModel.find({ userId, status: 'COMPLETED' })
    .select('sessionName startedAt endedAt totalPausedMs exercises')
    .sort({ startedAt: 1 })
    .lean();
  return docs.map(toStatsWorkout);
}

/** Records battus par une séance terminée, par rapport à toutes les séances antérieures. */
export async function recordsForWorkout(userId: string, doc: any) {
  const history = await loadHistory(userId);
  return detectForWorkout(history, toStatsWorkout(doc));
}
