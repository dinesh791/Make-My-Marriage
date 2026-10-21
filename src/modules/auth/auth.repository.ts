
import "server-only";
import mongoose, { type Types } from "mongoose";
import { connectToDatabase as connectMongoose } from "@/lib/db/mongoose";
import { UserModel } from "@/models/user";
import { AuthSessionModel } from "@/models/auth-session";
import { AuthRateLimitModel } from "@/models/auth-rate-limit";
import type { RegisterInput } from "./auth.validators";

let indexesReady: Promise<void> | undefined;

async function connectToDatabase() {
  await connectMongoose();
  // Fail closed if provisioning was skipped: `unique` is not a Mongoose validator.
  indexesReady ??= Promise.all([
    UserModel.collection.indexes(),
    AuthSessionModel.collection.indexes(),
    AuthRateLimitModel.collection.indexes(),
  ])
    .then(([users, sessions, limits]) => {
      if (
        !users.some(
          (index) =>
            index.name === "users_email_unique" &&
            index.unique &&
            index.key.email === 1 &&
            Object.keys(index.key).length === 1 &&
            !index.sparse &&
            !index.partialFilterExpression,
        ) ||
        !users.some(
          (index) =>
            index.name === "users_google_unique" &&
            index.unique &&
            index.sparse &&
            index.key.googleSubject === 1 &&
            Object.keys(index.key).length === 1 &&
            !index.partialFilterExpression,
        ) ||
        !sessions.some(
          (index) =>
            index.name === "sessions_token_unique" &&
            index.unique &&
            index.key.tokenHash === 1 &&
            Object.keys(index.key).length === 1 &&
            !index.sparse &&
            !index.partialFilterExpression,
        ) ||
        !sessions.some(
          (index) =>
            index.name === "sessions_expiry" &&
            index.expireAfterSeconds === 0 &&
            index.key.expiresAt === 1,
        ) ||
        !limits.some(
          (index) =>
            index.name === "auth_limits_expiry" &&
            index.expireAfterSeconds === 0 &&
            index.key.expiresAt === 1,
        )
      ) {
        throw new Error("Authentication storage is not provisioned; run npm run db:setup.");
      }
    })
    .catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  await indexesReady;
}

export function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

type SessionInput = { tokenHash: string; expiresAt: Date };

export async function createAccount(
  input: Omit<RegisterInput, "password"> & { passwordHash: string },
  session: SessionInput,
  previousTokenHash?: string,
) {
  await connectToDatabase();
  return mongoose.connection.transaction(async (transaction) => {
    const [user] = await UserModel.create([input], { session: transaction });
    await AuthSessionModel.create([{ ...session, userId: user._id }], { session: transaction });
    if (previousTokenHash) {
      await AuthSessionModel.deleteOne({ tokenHash: previousTokenHash }, { session: transaction });
    }
    return user;
  });
}

export async function findLoginUser(email: string) {
  await connectToDatabase();
  return UserModel.findOne({ email, deletedAt: null }).select("+passwordHash").exec();
}

export async function saveSession(
  userId: Types.ObjectId,
  session: SessionInput,
  previousTokenHash?: string,
) {
  await connectToDatabase();
  await mongoose.connection.transaction(async (transaction) => {
    await AuthSessionModel.create([{ ...session, userId }], { session: transaction });
    if (previousTokenHash) {
      await AuthSessionModel.deleteOne({ tokenHash: previousTokenHash }, { session: transaction });
    }
  });
}

export async function findSessionUser(tokenHash: string, now: Date) {
  await connectToDatabase();
  // TTL cleanup is asynchronous; expiration must also be checked on every request.
  const session = await AuthSessionModel.findOne({ tokenHash, expiresAt: { $gt: now } })
    .lean()
    .exec();
  if (!session) return null;
  return UserModel.findOne({ _id: session.userId, status: "ACTIVE", deletedAt: null })
    .lean()
    .exec();
}

export async function deleteSession(tokenHash: string) {
  await connectToDatabase();
  await AuthSessionModel.deleteOne({ tokenHash });
}

export async function incrementAuthLimit(key: string, expiresAt: Date) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("Auth database diagnostic", {
      operation: "connect-and-verify-indexes",
      errorType: error instanceof Error ? error.name : "non-error",
    });
    throw error;
  }

  try {
    const counter = await AuthRateLimitModel.findOneAndUpdate(
      { _id: key },
      { $inc: { attempts: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" },
    )
      .lean()
      .exec();
    return counter!.attempts;
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const counter = await AuthRateLimitModel.findOneAndUpdate(
      { _id: key },
      { $inc: { attempts: 1 } },
      { returnDocument: "after" },
    )
      .lean()
      .exec();
    if (!counter) throw error;
    return counter.attempts;
  }
}
