import nextEnv from "@next/env";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user.ts";
import { AuthSessionModel } from "../src/models/auth-session.ts";
import { AuthRateLimitModel } from "../src/models/auth-rate-limit.ts";
import { WeddingModel } from "../src/models/wedding.ts";
import { WeddingMemberModel } from "../src/models/wedding-member.ts";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
  info() {},
  error() {},
});
const deadline = setTimeout(() => {
  console.error(
    "Database setup timed out. Check your Atlas IP access list and connection settings.",
  );
  process.exit(1);
}, 60_000);
let phase = "validating database settings";

try {
  const uri = process.env.MONGODB_URI;
  if (!uri || !/^\/[a-zA-Z0-9_-]+$/.test(new URL(uri).pathname)) {
    throw new Error("DATABASE_CONFIG_INVALID");
  }
  phase = "connecting to MongoDB Atlas";
  await mongoose.connect(uri, {
    autoCreate: false,
    autoIndex: false,
    serverSelectionTimeoutMS: 10_000,
  });
  for (const model of [
    UserModel,
    AuthSessionModel,
    AuthRateLimitModel,
    WeddingModel,
    WeddingMemberModel,
  ]) {
    phase = `creating the ${model.collection.collectionName} collection`;
    await model.createCollection();
    // Add declared indexes without dropping existing indexes or touching user documents.
    phase = `adding indexes to ${model.collection.collectionName}`;
    await model.createIndexes();
    console.log(`Ready: ${model.collection.collectionName}`);
  }
  console.log("Database setup completed. No user accounts were seeded.");
} catch (error) {
  const errorType = error instanceof Error ? error.name : "UnknownError";
  console.error(
    `Database setup failed while ${phase} (${errorType}). Check the database name, Atlas access list, and index conflicts. Connection details were not printed.`,
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  clearTimeout(deadline);
}
