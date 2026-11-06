import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

let mongoServer: MongoMemoryServer;

/**
 * Démarre un serveur MongoDB en mémoire et configure MONGODB_URI
 * avant que les handlers (via connectToDatabase) ne s'y connectent.
 */
export async function startInMemoryDatabase(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.MONGODB_DB_NAME = 'gympulse-test';
  process.env.ALLOW_DEV_USER_HEADER = 'true';
}

export async function stopInMemoryDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearAllCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

interface EventOptions {
  body?: unknown;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  userId?: string | null;
}

/** Événement HTTP API v2 minimal ; `userId: null` simule un appel non authentifié. */
export function buildEvent(opts: EventOptions = {}): APIGatewayProxyEventV2 {
  const headers: Record<string, string> = {};
  if (opts.userId !== null) headers['x-user-id'] = opts.userId ?? 'user-1';
  return {
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    pathParameters: opts.pathParameters,
    queryStringParameters: opts.queryStringParameters,
    headers,
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2;
}
