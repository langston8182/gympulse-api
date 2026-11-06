import { APIGatewayProxyEventV2 } from 'aws-lambda';

jest.mock('../../src/config/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/models/exercise.model', () => ({
  ExerciseModel: { create: jest.fn(), find: jest.fn(), findOne: jest.fn() },
}));

import { handler as createExercise } from '../../src/handlers/exercises/create';
import { handler as getLibrary } from '../../src/handlers/exercises/library';
import { handler as health } from '../../src/handlers/health/get';
import { ExerciseModel } from '../../src/models/exercise.model';

const ID = '507f1f77bcf86cd799439011';

function event(overrides: Partial<APIGatewayProxyEventV2> = {}, userId: string | null = 'u1'): APIGatewayProxyEventV2 {
  return { headers: userId ? { 'x-user-id': userId } : {}, ...overrides } as unknown as APIGatewayProxyEventV2;
}

beforeEach(() => {
  process.env.ALLOW_DEV_USER_HEADER = 'true';
});
afterEach(() => jest.clearAllMocks());

describe('api wrapper', () => {
  it('répond 401 sans identité', async () => {
    const res = await createExercise(event({ body: '{}' }, null));
    expect(res.statusCode).toBe(401);
  });

  it("refuse l'en-tête x-user-id quand il n'est pas autorisé", async () => {
    process.env.ALLOW_DEV_USER_HEADER = 'false';
    const res = await createExercise(event({ body: '{}' }));
    expect(res.statusCode).toBe(401);
  });

  it('accepte le claim sub du JWT', async () => {
    const res = await createExercise({
      headers: {},
      body: '{"name":""}',
      requestContext: { authorizer: { jwt: { claims: { sub: 'abc' } } } },
    } as unknown as APIGatewayProxyEventV2);
    expect(res.statusCode).toBe(400);
  });

  it('répond 400 sur un JSON invalide', async () => {
    const res = await createExercise(event({ body: '{nope' }));
    expect(res.statusCode).toBe(400);
  });

  it('sert la santé sans authentification', async () => {
    const res = await health(event({}, null));
    expect(res.statusCode).toBe(200);
  });
});

describe('exercises (unit)', () => {
  it('valide le payload de création', async () => {
    const res = await createExercise(event({ body: JSON.stringify({ name: 'Curl', type: 'NOPE', equipment: ['LASER'] }) }));
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body as string);
    expect(body.details).toHaveProperty('type');
    expect(body.details).toHaveProperty('equipment');
    expect(ExerciseModel.create).not.toHaveBeenCalled();
  });

  it("crée l'exercice rattaché à l'utilisateur", async () => {
    (ExerciseModel.create as jest.Mock).mockResolvedValue({
      toObject: () => ({ _id: ID, name: 'Curl', type: 'REPETITIONS', muscleGroups: [], equipment: [], loadMode: 'TOTAL', notes: '' }),
    });
    const res = await createExercise(event({ body: JSON.stringify({ name: ' Curl ' }) }));
    expect(res.statusCode).toBe(201);
    expect(ExerciseModel.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Curl', userId: 'u1' }));
    expect(JSON.parse(res.body as string).ref).toBe(ID);
  });

  it('expose la bibliothèque fournie', async () => {
    const res = await getLibrary(event());
    const list = JSON.parse(res.body as string);
    expect(list).toHaveLength(40);
    expect(list[0]).toHaveProperty('ref', 'bench_db');
  });
});
