import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/models/user";
import type { UpdateProfileInput } from "@/modules/auth/auth.validators";

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  await connectToDatabase();
  const updates: Record<string, unknown> = {
    firstName: input.firstName,
  };
  if (input.lastName !== undefined) updates.lastName = input.lastName || null;
  if (input.email !== undefined) {
    updates.email = input.email;
    updates.emailVerifiedAt = null;
  }
  return UserModel.findOneAndUpdate(
    { _id: userId, status: "ACTIVE", deletedAt: null },
    { $set: updates },
    { new: true, runValidators: true },
  )
    .lean()
    .exec();
}

export async function findActiveAccountForPasswordCheck(userId: string) {
  await connectToDatabase();
  return UserModel.findOne({ _id: userId, status: "ACTIVE", deletedAt: null })
    .select("+passwordHash")
    .exec();
}

export function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
