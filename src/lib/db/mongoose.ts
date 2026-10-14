import "server-only";
import mongoose from "mongoose";
import { getDatabaseEnv } from "@/lib/env/env";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};
const globalForMongoose = globalThis as typeof globalThis & { mongoose?: MongooseCache };
const cache = globalForMongoose.mongoose ?? { connection: null, promise: null };
globalForMongoose.mongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.connection) return cache.connection;
  if (!cache.promise) {
    const { MONGODB_URI } = getDatabaseEnv();
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        autoCreate: false,
        autoIndex: false,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error: unknown) => {
        cache.promise = null;
        throw error;
      });
  }
  cache.connection = await cache.promise;
  return cache.connection;
}
