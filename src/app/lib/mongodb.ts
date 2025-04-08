import { MongoClient } from "mongodb";

const getMongoClient = (): MongoClient => {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  return new MongoClient(uri);
};

export const getClientPromise = ():Promise<MongoClient> => {
  let clientPromise: Promise<MongoClient>;

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = getMongoClient().connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    clientPromise = getMongoClient().connect();
  }

  return clientPromise;
};
// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default getClientPromise;
