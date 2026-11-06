import { clearAllCollections, buildEvent, startInMemoryDatabase, stopInMemoryDatabase } from '../helpers/setupTestDb';
import { connectToDatabase } from '../../src/config/db';

import { handler as createExercise } from '../../src/handlers/exercises/create';
import { handler as deleteExercise } from '../../src/handlers/exercises/remove';
import { handler as createLocation } from '../../src/handlers/locations/create';
import { handler as deleteLocation } from '../../src/handlers/locations/remove';
import { linkSessions } from '../../src/handlers/locations/link';
import { handler as createSession } from '../../src/handlers/sessions/create';
import { handler as getSession } from '../../src/handlers/sessions/getById';
import { handler as duplicateSession } from '../../src/handlers/sessions/duplicate';
import { handler as deleteSession } from '../../src/handlers/sessions/remove';
import { handler as createProgram } from '../../src/handlers/programs/create';
import { handler as getProgram } from '../../src/handlers/programs/getById';
import { handler as getCatalog } from '../../src/handlers/catalog/get';
import { getActive, saveActive, abandonActive } from '../../src/handlers/workouts/active';
import { handler as completeWorkout } from '../../src/handlers/workouts/complete';
import { handler as createWorkout } from '../../src/handlers/workouts/create';
import { handler as getWorkouts } from '../../src/handlers/workouts/getAll';
import { handler as dashboard } from '../../src/handlers/stats/dashboard';
import { handler as exerciseStats } from '../../src/handlers/stats/exercise';
import { getAll as lastPerformances, getOne as lastPerformance } from '../../src/handlers/stats/lastPerformance';
import { handler as getPrefs } from '../../src/handlers/preferences/get';
import { handler as updatePrefs } from '../../src/handlers/preferences/update';
import { seed, status, remove as removeDemo } from '../../src/handlers/demo/demo';

const json = (res: { body?: string }) => JSON.parse(res.body as string);

beforeAll(async () => {
  await startInMemoryDatabase();
  await connectToDatabase();
  const { WorkoutModel } = await import('../../src/models/workout.model');
  await WorkoutModel.init();
});

afterEach(async () => {
  await clearAllCollections();
});

afterAll(async () => {
  await stopInMemoryDatabase();
});

const set = (reps: number, weightKg: number) => ({ reps, weightKg, completedAt: Date.now() });

describe('catalogue (intégration)', () => {
  it('crée lieux, séances, programmes et les relie', async () => {
    const loc = json(await createLocation(buildEvent({ body: { name: 'Salle', address: '10 rue de Rivoli, Paris', type: 'GYM', latitude: 48.85, longitude: 2.36, equipment: ['BARBELL'] } })));
    expect(loc.address).toBe('10 rue de Rivoli, Paris');
    const custom = json(await createExercise(buildEvent({ body: { name: 'Mon exo', muscleGroups: ['CHEST'] } })));

    const sessionRes = await createSession(buildEvent({
      body: {
        name: 'Push', goal: 'STRENGTH', locationRefs: [loc.ref],
        exercises: [
          { exerciseRef: 'bench_bb', restSeconds: 120, sets: [{ reps: 5, weightKg: 80 }] },
          { exerciseRef: custom.ref, restSeconds: 60, sets: [{ reps: 10 }] },
        ],
      },
    }));
    expect(sessionRes.statusCode).toBe(201);
    const session = json(sessionRes);

    const program = json(await createProgram(buildEvent({ body: { name: 'PPL', sessionRefs: [session.ref] } })));
    expect((await getProgram(buildEvent({ pathParameters: { id: program.ref } }))).statusCode).toBe(200);

    const catalog = json(await getCatalog(buildEvent()));
    expect(catalog.locations).toHaveLength(1);
    expect(catalog.sessions[0].locationRefs).toEqual([loc.ref]);

    const copy = json(await duplicateSession(buildEvent({ pathParameters: { id: session.ref } })));
    expect(copy.name).toBe('Push (copie)');

    // Supprimer la séance la retire du programme
    await deleteSession(buildEvent({ pathParameters: { id: session.ref } }));
    expect(json(await getProgram(buildEvent({ pathParameters: { id: program.ref } }))).sessionRefs).toEqual([]);
  });

  it('rejette une séance avec exercice ou lieu inconnu', async () => {
    const res = await createSession(buildEvent({ body: { name: 'X', exercises: [{ exerciseRef: 'nope', restSeconds: 60, sets: [] }] } }));
    expect(res.statusCode).toBe(400);
    const res2 = await createSession(buildEvent({ body: { name: 'X', locationRefs: ['507f1f77bcf86cd799439011'] } }));
    expect(res2.statusCode).toBe(400);
  });

  it("renvoie les séances dans l'ordre choisi par l'utilisateur et accepte le but force-hypertrophie", async () => {
    await createSession(buildEvent({ body: { name: 'B', order: 1, goal: 'STRENGTH_HYPERTROPHY' } }));
    await createSession(buildEvent({ body: { name: 'A', order: 0 } }));
    const catalog = json(await getCatalog(buildEvent()));
    expect(catalog.sessions.map((x: any) => x.name)).toEqual(['A', 'B']);
    expect(catalog.sessions[1].goal).toBe('STRENGTH_HYPERTROPHY');
    expect(catalog.sessions[1].order).toBe(1);
  });

  it('isole les données entre utilisateurs', async () => {
    await createLocation(buildEvent({ userId: 'alice', body: { name: 'Chez Alice' } }));
    const bob = json(await getCatalog(buildEvent({ userId: 'bob' })));
    expect(bob.locations).toEqual([]);
  });

  it("protège la suppression d'un exercice utilisé", async () => {
    const custom = json(await createExercise(buildEvent({ body: { name: 'Mon exo' } })));
    const session = json(await createSession(buildEvent({
      body: { name: 'S', exercises: [{ exerciseRef: custom.ref, restSeconds: 60, sets: [{ reps: 8 }] }] },
    })));
    const refused = await deleteExercise(buildEvent({ pathParameters: { id: custom.ref } }));
    expect(refused.statusCode).toBe(409);
    expect(json(refused).details.sessionCount).toBe(1);

    expect((await deleteExercise(buildEvent({ pathParameters: { id: custom.ref }, queryStringParameters: { force: 'true' } }))).statusCode).toBe(204);
    expect(json(await getSession(buildEvent({ pathParameters: { id: session.ref } }))).exercises).toEqual([]);
  });

  it('lie des séances à un lieu et nettoie à la suppression du lieu', async () => {
    const loc = json(await createLocation(buildEvent({ body: { name: 'Salle' } })));
    const session = json(await createSession(buildEvent({ body: { name: 'S' } })));
    const linked = await linkSessions(buildEvent({ pathParameters: { id: loc.ref }, body: { sessionRefs: [session.ref] } }));
    expect(linked.statusCode).toBe(200);
    expect(json(await getSession(buildEvent({ pathParameters: { id: session.ref } }))).locationRefs).toEqual([loc.ref]);

    await deleteLocation(buildEvent({ pathParameters: { id: loc.ref } }));
    expect(json(await getSession(buildEvent({ pathParameters: { id: session.ref } }))).locationRefs).toEqual([]);
  });
});

describe('séance en cours (intégration)', () => {
  const startedAt = Date.now() - 3_600_000;
  const active = () => ({
    sessionName: 'Push', startedAt, goal: 'STRENGTH',
    exercises: [{ exerciseRef: 'bench_bb', restSeconds: 120, sets: [{ targetReps: 5, targetWeightKg: 80, restSeconds: 120 }, { targetReps: 5, targetWeightKg: 80, restSeconds: 120 }] }],
  });

  it('upsert, reprise, complétion et abandon', async () => {
    expect((await getActive(buildEvent())).statusCode).toBe(204);

    const saved = await saveActive(buildEvent({ body: active() }));
    expect(saved.statusCode).toBe(200);
    expect(json(saved).exercises[0].name).toBe('Développé couché barre');
    expect(json(saved).exercises[0].sets[0].status).toBe('PENDING');

    const body = active();
    (body.exercises[0].sets[0] as any).reps = 5;
    (body.exercises[0].sets[0] as any).weightKg = 80;
    const resaved = json(await saveActive(buildEvent({ body: { ...body, status: 'PAUSED', rest: { endsAt: 1 } } })));
    expect(resaved.ref).toBe(json(saved).ref);
    expect(resaved.status).toBe('PAUSED');
    expect(resaved.exercises[0].sets[0].status).toBe('COMPLETED');

    const done = await completeWorkout(buildEvent({ body: { notes: 'Top' } }));
    expect(done.statusCode).toBe(200);
    const workout = json(done);
    expect(workout.status).toBe('COMPLETED');
    expect(workout.notes).toBe('Top');
    expect(workout.exercises[0].sets[1].status).toBe('SKIPPED');
    expect((await getActive(buildEvent())).statusCode).toBe(204);
    expect(json(await getWorkouts(buildEvent()))).toHaveLength(1);

    await saveActive(buildEvent({ body: active() }));
    expect((await abandonActive(buildEvent())).statusCode).toBe(204);
    expect((await getActive(buildEvent())).statusCode).toBe(204);
  });

  it('refuse deux requêtes de fin sans séance active', async () => {
    expect((await completeWorkout(buildEvent({ body: {} }))).statusCode).toBe(404);
  });
});

describe('historique, records et statistiques (intégration)', () => {
  const day = 86_400_000;
  const history = (daysAgo: number, weight: number) => ({
    sessionName: 'Push', startedAt: Date.now() - daysAgo * day, endedAt: Date.now() - daysAgo * day + 3_600_000,
    exercises: [{ exerciseRef: 'bench_bb', restSeconds: 90, sets: [set(8, weight), set(8, weight)] }],
  });

  it('détecte les records et calcule les stats', async () => {
    const first = await createWorkout(buildEvent({ body: history(10, 60) }));
    expect(first.statusCode).toBe(201);
    expect(json(first).records).toEqual([]);

    const second = json(await createWorkout(buildEvent({ body: history(3, 70) })));
    expect(second.records.map((r: any) => r.type)).toContain('MAX_WEIGHT');

    const stats = json(await dashboard(buildEvent({ queryStringParameters: { period: 'MONTH' } })));
    expect(stats.totalWorkouts).toBe(2);
    expect(stats.lastWorkout.ref).toBe(second.ref);
    expect(stats.periodTotals.volumeKg).toBe(8 * 60 * 2 + 8 * 70 * 2);

    const ex = json(await exerciseStats(buildEvent({ pathParameters: { ref: 'bench_bb' } })));
    expect(ex.maxWeightKg).toBe(70);

    const last = json(await lastPerformances(buildEvent()));
    expect(last.bench_bb.topWeightKg).toBe(70);

    const one = await lastPerformance(buildEvent({ pathParameters: { ref: 'bench_bb' }, queryStringParameters: { excluding: second.ref } }));
    expect(json(one).topWeightKg).toBe(60);
    expect((await lastPerformance(buildEvent({ pathParameters: { ref: 'squat_bb' } }))).statusCode).toBe(204);
  });

  it('rejette une période invalide', async () => {
    expect((await dashboard(buildEvent({ queryStringParameters: { period: 'DECADE' } }))).statusCode).toBe(400);
  });
});

describe('préférences et démo (intégration)', () => {
  it('renvoie des valeurs par défaut puis persiste les changements', async () => {
    expect(json(await getPrefs(buildEvent())).defaultRestSeconds).toBe(90);
    const updated = await updatePrefs(buildEvent({ body: { weightUnit: 'LB', weeklyGoal: 4, userName: 'Cyr' } }));
    expect(json(updated)).toMatchObject({ weightUnit: 'LB', weeklyGoal: 4, userName: 'Cyr', themeMode: 'DARK' });
    expect((await updatePrefs(buildEvent({ body: { weeklyGoal: 99 } }))).statusCode).toBe(400);
  });

  it('génère puis supprime les données de démonstration sans toucher au reste', async () => {
    await createLocation(buildEvent({ body: { name: 'Mon lieu' } }));
    const seeded = await seed(buildEvent());
    expect(seeded.statusCode).toBe(201);
    expect(json(seeded).created.workouts).toBeGreaterThan(40);
    expect(json(await status(buildEvent())).hasDemo).toBe(true);

    const catalog = json(await getCatalog(buildEvent()));
    expect(catalog.sessions).toHaveLength(8);
    expect(catalog.locations).toHaveLength(4);

    const stats = json(await dashboard(buildEvent({ queryStringParameters: { period: 'ALL' } })));
    expect(stats.totalWorkouts).toBeGreaterThan(40);

    await removeDemo(buildEvent());
    expect(json(await status(buildEvent())).hasDemo).toBe(false);
    const after = json(await getCatalog(buildEvent()));
    expect(after.locations).toHaveLength(1);
    expect(after.sessions).toHaveLength(0);
    expect(json(await getWorkouts(buildEvent()))).toHaveLength(0);
  });
});
