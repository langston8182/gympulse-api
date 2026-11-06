import { detect, detectForWorkout } from '../../src/domain/records';
import { dashboard, exerciseProgress, periodRange } from '../../src/domain/statsCalculator';
import { StatsWorkout } from '../../src/domain/statsTypes';
import { estimatedOneRepMax, exerciseVolumeKg, performance } from '../../src/domain/trainingMath';
import { generateDemoHistory } from '../../src/domain/demoHistory';
import { mondayOnOrBefore, startOfDay, toEpochDay } from '../../src/utils/time';

function workout(id: string, startedAt: number, sets: Array<[number, number]>, loadMode: 'TOTAL' | 'PER_IMPLEMENT' = 'TOTAL'): StatsWorkout {
  return {
    id,
    sessionName: 'Push',
    startedAt,
    durationMs: 3_600_000,
    exercises: [{
      exerciseRef: 'bench',
      name: 'Développé couché',
      type: 'REPETITIONS',
      loadMode,
      muscleGroups: ['CHEST'],
      sets: sets.map(([reps, weightKg]) => ({ status: 'COMPLETED', reps, weightKg })),
    }],
  };
}

const DAY = 86_400_000;

describe('trainingMath', () => {
  it("estime le 1RM avec Epley, uniquement de 1 à 12 reps", () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100);
    expect(estimatedOneRepMax(100, 10)).toBeCloseTo(133.33, 1);
    expect(estimatedOneRepMax(100, 13)).toBeNull();
    expect(estimatedOneRepMax(0, 5)).toBeNull();
  });

  it('compte deux haltères en mode PER_IMPLEMENT', () => {
    const w = workout('a', 0, [[10, 20]], 'PER_IMPLEMENT');
    expect(exerciseVolumeKg(w.exercises[0])).toBe(400);
  });

  it('ignore les séries non terminées', () => {
    const w = workout('a', 0, [[10, 20]]);
    w.exercises[0].sets.push({ status: 'SKIPPED', reps: 10, weightKg: 100 });
    expect(performance(w, w.exercises[0])?.topWeightKg).toBe(20);
  });
});

describe('records', () => {
  const first = workout('1', 1000, [[10, 50]]);
  const second = workout('2', 2000, [[10, 60]]);

  it("ne considère jamais une première performance comme un record", () => {
    expect(detectForWorkout([first], first)).toEqual([]);
  });

  it('détecte une hausse de charge', () => {
    const records = detectForWorkout([first, second], second);
    expect(records.map((r) => r.type)).toEqual(expect.arrayContaining(['MAX_WEIGHT', 'ESTIMATED_ONE_REP_MAX', 'SESSION_VOLUME']));
    expect(records.find((r) => r.type === 'MAX_WEIGHT')).toMatchObject({ value: 60, previousValue: 50 });
  });

  it("n'accorde pas de record de 1RM à une charge plus lourde avec beaucoup moins de reps", () => {
    const heavy = workout('3', 3000, [[1, 62]]);
    const prev = [first, second].flatMap((w) => w.exercises.map((e) => performance(w, e)!));
    const records = detect(prev, performance(heavy, heavy.exercises[0])!);
    expect(records.map((r) => r.type)).toContain('MAX_WEIGHT');
    expect(records.map((r) => r.type)).not.toContain('ESTIMATED_ONE_REP_MAX');
  });
});

describe('time', () => {
  it('calcule les lundis', () => {
    // 2026-11-05 est un jeudi
    const thursday = toEpochDay({ y: 2026, m: 11, d: 5 });
    expect(mondayOnOrBefore(thursday)).toBe(toEpochDay({ y: 2026, m: 11, d: 2 }));
  });

  it('gère le changement d\'heure (Europe/Paris)', () => {
    const march29 = toEpochDay({ y: 2026, m: 3, d: 29 });
    const length = startOfDay(march29 + 1, 'Europe/Paris') - startOfDay(march29, 'Europe/Paris');
    expect(length).toBe(23 * 3_600_000);
  });
});

describe('statsCalculator', () => {
  const tz = 'Europe/Paris';
  const now = Date.UTC(2026, 10, 5, 12);

  it('borne la période semaine sur 7 jours locaux', () => {
    const range = periodRange('WEEK', now, tz, null);
    expect(Math.round((range.end - range.start) / DAY)).toBe(7);
  });

  it('agrège un tableau de bord cohérent sur un historique généré', () => {
    const generated = generateDemoHistory(now, tz);
    expect(generated.length).toBeGreaterThan(40);
    const history: StatsWorkout[] = generated.map((g, i) => ({
      id: String(i),
      sessionName: g.sessionKey,
      startedAt: g.startedAt,
      durationMs: g.endedAt - g.startedAt,
      exercises: g.exercises.map((e) => ({
        exerciseRef: e.exerciseRef,
        name: e.exerciseRef,
        type: e.sets[0].durationSeconds ? 'DURATION' : 'REPETITIONS',
        loadMode: 'TOTAL',
        muscleGroups: ['CHEST'],
        sets: e.sets.map((s) => ({ status: 'COMPLETED', reps: s.reps, weightKg: s.weightKg, durationSeconds: s.durationSeconds })),
      })),
    }));

    const stats = dashboard(history, 'ALL', now, tz);
    expect(stats.totalWorkouts).toBe(history.length);
    expect(stats.periodTotals.workouts).toBe(history.length);
    expect(stats.volumeSeries.reduce((s, p) => s + p.value, 0)).toBeCloseTo(stats.periodTotals.volumeKg, 3);
    expect(stats.frequencySeries.reduce((s, p) => s + p.value, 0)).toBe(history.length);
    expect(stats.topExercises.length).toBeGreaterThan(0);
  });

  it("calcule la progression d'un exercice", () => {
    const history = [workout('1', now - 10 * DAY, [[10, 50]]), workout('2', now - 2 * DAY, [[8, 60], [6, 65]])];
    const progress = exerciseProgress('bench', history, 'MONTH', now, tz);
    expect(progress.maxWeightKg).toBe(65);
    expect(progress.totalSets).toBe(3);
    expect(progress.records.length).toBeGreaterThan(0);
    expect(progress.repMaxes.find((r) => r.repetitions === 5)?.weightKg).toBe(65);
  });
});
