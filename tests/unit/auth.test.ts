import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { resolveUserId } from '../../src/utils/handler';

const event = (headers: Record<string, string> = {}, requestContext: unknown = {}) =>
  ({ headers, requestContext }) as unknown as APIGatewayProxyEventV2;

describe('resolveUserId', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it("utilise le claim sub d'un authorizer API Gateway", async () => {
    const e = event({}, { authorizer: { jwt: { claims: { sub: 'abc' } } } });
    await expect(resolveUserId(e)).resolves.toBe('abc');
  });

  it("accepte x-user-id uniquement quand ALLOW_DEV_USER_HEADER=true", async () => {
    process.env.ALLOW_DEV_USER_HEADER = 'true';
    await expect(resolveUserId(event({ 'x-user-id': 'dev-user' }))).resolves.toBe('dev-user');
    process.env.ALLOW_DEV_USER_HEADER = 'false';
    await expect(resolveUserId(event({ 'x-user-id': 'dev-user' }))).rejects.toMatchObject({ statusCode: 401 });
  });

  it("refuse un jeton Bearer quand Cognito n'est pas configuré", async () => {
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.COGNITO_CLIENT_ID;
    await expect(resolveUserId(event({ authorization: 'Bearer abc.def.ghi' }))).rejects.toMatchObject({ statusCode: 401 });
  });

  it('refuse un jeton Bearer invalide ou falsifié', async () => {
    process.env.COGNITO_USER_POOL_ID = 'eu-west-3_test';
    process.env.COGNITO_CLIENT_ID = 'client';
    await expect(resolveUserId(event({ authorization: 'Bearer pas-un-jwt' }))).rejects.toMatchObject({ statusCode: 401 });
  });

  it("n'accepte pas x-user-id à la place d'un jeton invalide", async () => {
    process.env.ALLOW_DEV_USER_HEADER = 'true';
    process.env.COGNITO_USER_POOL_ID = 'eu-west-3_test';
    process.env.COGNITO_CLIENT_ID = 'client';
    await expect(resolveUserId(event({ authorization: 'Bearer faux', 'x-user-id': 'dev' }))).rejects.toMatchObject({ statusCode: 401 });
  });

  it("sans identifiant, répond 401", async () => {
    await expect(resolveUserId(event())).rejects.toMatchObject({ statusCode: 401 });
  });
});
