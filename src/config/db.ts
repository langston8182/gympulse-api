import mongoose from 'mongoose';

/**
 * Cache de connexion partagé entre invocations Lambda "chaudes" (warm start),
 * pour éviter de rouvrir une connexion MongoDB à chaque appel.
 */
let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  mongoose.set('strictQuery', true);

  cachedConnection = await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || 'gympulse',
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
  });

  return cachedConnection;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
  }
}
