import { workoutToDto } from '../../mappers';
import { WorkoutModel } from '../../models/workout.model';
import { recordsForWorkout } from '../../services/history';
import { buildWorkoutFields } from '../../services/workoutBuilder';
import { api, ok } from '../../utils/handler';
import { error } from '../../utils/response';

/**
 * POST /v1/workouts/active/complete — termine la séance en cours (« Terminer et enregistrer »).
 * Le corps est optionnel : il peut surcharger l'état final (notes, endedAt, exercices…).
 * Les séries restées en attente sont marquées SKIPPED. Réponse : la séance + ses nouveaux records.
 */
export const handler = api(async ({ userId, body }) => {
  const active: any = await WorkoutModel.findOne({ userId, active: true }).lean();
  if (!active) return error(404, 'Aucune séance en cours');

  const base: Record<string, any> = workoutToDto(active);
  delete base.rest;
  delete base.setTimer;
  delete base.pausedAt;
  const merged: Record<string, any> = { ...base, ...body, status: 'COMPLETED', endedAt: body.endedAt ?? Date.now() };
  if (Array.isArray(merged.exercises)) {
    merged.exercises = merged.exercises.map((e: any) => ({
      ...e,
      sets: Array.isArray(e?.sets)
        ? e.sets.map((s: any) => (s?.status === 'PENDING' ? { ...s, status: 'SKIPPED' } : s))
        : e?.sets,
      status: e?.status === 'PENDING' || e?.status === 'IN_PROGRESS' ? undefined : e?.status,
    }));
  }

  const fields = await buildWorkoutFields(userId, merged, 'history');
  const workout: any = await WorkoutModel.findOneAndUpdate(
    { _id: active._id, userId },
    { $set: { ...fields, rest: null, setTimer: null, pausedAt: null } },
    { new: true, runValidators: true },
  ).lean();
  const records = await recordsForWorkout(userId, workout);
  return ok({ ...workoutToDto(workout), records });
});
