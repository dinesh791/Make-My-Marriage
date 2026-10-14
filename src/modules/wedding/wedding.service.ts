import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/http/errors";
import type { CreateWeddingInput } from "./wedding.validators";
import * as repository from "./wedding.repository";

function slugBase(title: string) {
  return (
    title
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 78) || "wedding"
  );
}

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

export async function getMyWedding(userId: string) {
  await connectToDatabase();
  await repository.ensureWeddingStorage();
  return repository.findActiveWeddingForUser(userId);
}

export async function getWeddingForMember(weddingId: string, userId: string) {
  if (!Types.ObjectId.isValid(weddingId)) {
    throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
  }
  await connectToDatabase();
  await repository.ensureWeddingStorage();
  const wedding = await repository.findMemberWedding(weddingId, userId);
  if (!wedding) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
  return wedding;
}

export async function createWedding(userId: string, input: CreateWeddingInput) {
  await connectToDatabase();
  await repository.ensureWeddingStorage();
  if (await repository.findActiveWeddingForUser(userId)) {
    throw new AppError(
      "WEDDING_ALREADY_ACTIVE",
      "Your account already belongs to an active wedding.",
      409,
    );
  }
  const base = slugBase(input.title);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
    try {
      return await repository.createWeddingWithMember(userId, {
        slug,
        title: input.title,
        role: input.role,
        story: input.story || null,
        weddingDate: new Date(input.weddingDate),
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        mapsUrl: input.mapsUrl || null,
      });
    } catch (error) {
      if (isDuplicateKey(error)) {
        const existing = await repository.findActiveWeddingForUser(userId);
        if (existing) {
          throw new AppError(
            "WEDDING_ALREADY_ACTIVE",
            "Your account already belongs to an active wedding.",
            409,
          );
        }
        if (attempt < 2) continue;
        throw new AppError(
          "WEDDING_SLUG_TAKEN",
          "We couldn't reserve a wedding link. Please try again.",
          409,
        );
      }
      throw error;
    }
  }
  throw new AppError(
    "WEDDING_CREATE_FAILED",
    "We couldn't create the wedding. Please try again.",
    503,
  );
}
