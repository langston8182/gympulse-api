import { StatsWorkout } from '../domain/statsTypes';

const id = (v: any): string => String(v);
const iso = (d?: Date) => (d ? d.toISOString() : undefined);

export function exerciseToDto(doc: any) {
  return {
    ref: id(doc._id),
    name: doc.name,
    type: doc.type,
    muscleGroups: doc.muscleGroups ?? [],
    equipment: doc.equipment ?? [],
    loadMode: doc.loadMode,
    imageUri: doc.imageUri ?? null,
    notes: doc.notes ?? '',
    isDemo: !!doc.isDemo,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function sessionToDto(doc: any) {
  return {
    ref: id(doc._id),
    name: doc.name,
    description: doc.description ?? '',
    goal: doc.goal,
    exercises: (doc.exercises ?? []).map((e: any) => ({
      exerciseRef: e.exerciseRef,
      restSeconds: e.restSeconds,
      sets: (e.sets ?? []).map((s: any) => ({
        reps: s.reps ?? null,
        weightKg: s.weightKg ?? null,
        durationSeconds: s.durationSeconds ?? null,
        restSeconds: s.restSeconds ?? null,
      })),
      notes: e.notes ?? '',
    })),
    locationRefs: doc.locationRefs ?? [],
    favorite: !!doc.favorite,
    isDemo: !!doc.isDemo,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function programToDto(doc: any) {
  return {
    ref: id(doc._id),
    name: doc.name,
    description: doc.description ?? '',
    goal: doc.goal,
    sessionRefs: doc.sessionRefs ?? [],
    locationRefs: doc.locationRefs ?? [],
    isDemo: !!doc.isDemo,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function locationToDto(doc: any) {
  return {
    ref: id(doc._id),
    name: doc.name,
    latitude: doc.latitude ?? null,
    longitude: doc.longitude ?? null,
    radiusMeters: doc.radiusMeters,
    type: doc.type,
    equipment: doc.equipment ?? [],
    isDemo: !!doc.isDemo,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function preferencesToDto(doc: any) {
  return {
    onboardingCompleted: !!doc.onboardingCompleted,
    userName: doc.userName ?? '',
    themeMode: doc.themeMode,
    dynamicColor: !!doc.dynamicColor,
    weightUnit: doc.weightUnit,
    soundEnabled: !!doc.soundEnabled,
    vibrationEnabled: !!doc.vibrationEnabled,
    keepScreenOn: !!doc.keepScreenOn,
    defaultRestSeconds: doc.defaultRestSeconds,
    weeklyGoal: doc.weeklyGoal,
    autoDetectLocation: !!doc.autoDetectLocation,
    manualLocationRef: doc.manualLocationRef ?? null,
  };
}

export function workoutToDto(doc: any) {
  return {
    ref: id(doc._id),
    sessionRef: doc.sessionRef ?? null,
    sessionName: doc.sessionName,
    goal: doc.goal,
    status: doc.status,
    startedAt: doc.startedAt,
    endedAt: doc.endedAt ?? null,
    pausedAt: doc.pausedAt ?? null,
    totalPausedMs: doc.totalPausedMs ?? 0,
    locationRef: doc.locationRef ?? null,
    locationName: doc.locationName ?? null,
    notes: doc.notes ?? '',
    currentExerciseIndex: doc.currentExerciseIndex ?? 0,
    currentSetIndex: doc.currentSetIndex ?? 0,
    rest: doc.rest ?? null,
    setTimer: doc.setTimer ?? null,
    exercises: (doc.exercises ?? []).map((e: any) => ({
      key: e.key,
      exerciseRef: e.exerciseRef ?? null,
      name: e.name,
      type: e.type,
      loadMode: e.loadMode,
      imageUri: e.imageUri ?? null,
      muscleGroups: e.muscleGroups ?? [],
      equipment: e.equipment ?? [],
      restSeconds: e.restSeconds,
      notes: e.notes ?? '',
      status: e.status,
      sets: (e.sets ?? []).map((s: any) => ({
        targetReps: s.targetReps ?? null,
        targetWeightKg: s.targetWeightKg ?? null,
        targetDurationSeconds: s.targetDurationSeconds ?? null,
        restSeconds: s.restSeconds ?? 0,
        reps: s.reps ?? null,
        weightKg: s.weightKg ?? null,
        durationSeconds: s.durationSeconds ?? null,
        actualRestSeconds: s.actualRestSeconds ?? null,
        status: s.status,
        completedAt: s.completedAt ?? null,
        isExtra: !!s.isExtra,
      })),
    })),
    isDemo: !!doc.isDemo,
  };
}

export function toStatsWorkout(doc: any): StatsWorkout {
  const endedAt = doc.endedAt ?? doc.startedAt;
  return {
    id: id(doc._id),
    sessionName: doc.sessionName,
    startedAt: doc.startedAt,
    durationMs: Math.max(endedAt - doc.startedAt - (doc.totalPausedMs ?? 0), 0),
    exercises: (doc.exercises ?? []).map((e: any) => ({
      exerciseRef: e.exerciseRef ?? null,
      name: e.name,
      type: e.type,
      loadMode: e.loadMode,
      muscleGroups: e.muscleGroups ?? [],
      sets: (e.sets ?? []).map((s: any) => ({
        status: s.status, reps: s.reps, weightKg: s.weightKg, durationSeconds: s.durationSeconds,
      })),
    })),
  };
}
