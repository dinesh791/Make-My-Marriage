import "server-only";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AppError } from "@/lib/http/errors";
import { hashAuthValue } from "@/modules/auth/auth.service";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import * as repository from "./partner-invite.repository";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function inviteHash(token: string) {
  return hashAuthValue(`partner-invite:${token}`);
}

function validToken(token: string) {
  if (!TOKEN_PATTERN.test(token)) {
    throw new AppError("WEDDING_PARTNER_INVITE_INVALID", "This invitation is invalid.", 404);
  }
}

export async function getPartnerStatus(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  const member = await repository.findMembership(weddingId, userId);
  if (!member) throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
  const targetRole: "BRIDE" | "GROOM" = member.role === "BRIDE" ? "GROOM" : "BRIDE";
  const partner = await repository.findRoleMember(weddingId, targetRole);
  return { targetRole, joined: Boolean(partner) };
}

export async function createPartnerInvite(weddingId: string, userId: string) {
  if (!Types.ObjectId.isValid(weddingId)) {
    throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
  }
  await connectToDatabase();
  await repository.ensurePartnerInviteStorage();
  const { targetRole, joined } = await getPartnerStatus(weddingId, userId);
  if (joined) throw new AppError("WEDDING_PARTNER_JOINED", "Your partner has already joined.", 409);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SEVEN_DAYS);
  try {
    await repository.rotateInvite({
      weddingId,
      userId,
      role: targetRole,
      tokenHash: inviteHash(token),
      expiresAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITE_ROLE_UNAVAILABLE") {
      throw new AppError("WEDDING_PARTNER_JOINED", "Your partner has already joined.", 409);
    }
    if (error instanceof Error && error.message === "INVITE_WEDDING_MISSING") {
      throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
    }
    throw error;
  }
  return { token, expiresAt: expiresAt.toISOString(), targetRole };
}

export async function getPartnerInvitePreview(token: string) {
  validToken(token);
  await connectToDatabase();
  await repository.ensurePartnerInviteStorage();
  const invite = await repository.findInvite(inviteHash(token));
  if (!invite || invite.usedAt || invite.revokedAt) {
    throw new AppError(
      "WEDDING_PARTNER_INVITE_INVALID",
      "This invitation is no longer available.",
      404,
    );
  }
  if (invite.expiresAt <= new Date()) {
    throw new AppError("WEDDING_PARTNER_INVITE_EXPIRED", "This invitation has expired.", 410);
  }
  const wedding = await getWeddingForMember(
    String(invite.weddingId),
    String(invite.invitedByUserId),
  );
  return { title: wedding.title, targetRole: invite.targetRole, expiresAt: invite.expiresAt };
}

export async function acceptPartnerInvite(token: string, userId: string) {
  validToken(token);
  await getPartnerInvitePreview(token);
  try {
    await repository.acceptInvite(inviteHash(token), userId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVITE_SELF" || error.message === "INVITE_ALREADY_MEMBER") {
        throw new AppError(
          "WEDDING_ALREADY_ACTIVE",
          "Your account already belongs to a wedding.",
          409,
        );
      }
      if (error.message === "INVITE_ROLE_UNAVAILABLE") {
        throw new AppError(
          "WEDDING_PARTNER_JOINED",
          "A partner has already joined this wedding.",
          409,
        );
      }
      if (error.message === "INVITE_UNAVAILABLE") {
        throw new AppError(
          "WEDDING_PARTNER_INVITE_INVALID",
          "This invitation is no longer available.",
          404,
        );
      }
      if ("code" in error && error.code === 11000) {
        throw new AppError(
          "WEDDING_ALREADY_ACTIVE",
          "This invitation cannot be accepted by this account.",
          409,
        );
      }
    }
    throw error;
  }
}
