import "server-only";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { getEmailEnv } from "@/lib/env/env";
import { getEmailClient } from "@/lib/email/client";
import { AppError } from "@/lib/http/errors";
import { connectToDatabase } from "@/lib/db/mongoose";
import { hashAuthValue, enforceAuthLimit } from "@/modules/auth/auth.service";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import { WeddingMemberModel } from "@/models/wedding-member";
import * as repository from "./guest-invitation.repository";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const INVITE_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

function tokenHash(token: string) {
  return hashAuthValue(`guest-invitation:${token}`);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );
}

function publicInviteError() {
  return new AppError(
    "GUEST_INVITATION_INVALID",
    "This invitation is unavailable. Ask the couple for help.",
    404,
  );
}

async function ready() {
  await connectToDatabase();
  await repository.ensureGuestInvitationStorage();
}

export async function listGuestInvitations(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  await ready();
  const records = await repository.listForWedding(weddingId);
  return records.map((item) => ({
    id: String(item._id),
    recipientEmail: item.recipientEmail,
    sendStatus: item.sendStatus,
    response: item.response,
    sentAt: item.sentAt?.toISOString() ?? null,
    respondedAt: item.respondedAt?.toISOString() ?? null,
  }));
}

export async function sendGuestInvitations(
  weddingId: string,
  userId: string,
  recipients: string[],
) {
  if (!Types.ObjectId.isValid(weddingId))
    throw new AppError("WEDDING_NOT_FOUND", "Wedding not found.", 404);
  const wedding = await getWeddingForMember(weddingId, userId);
  await ready();
  let emailEnv: ReturnType<typeof getEmailEnv>;
  try {
    emailEnv = getEmailEnv();
  } catch {
    throw new AppError(
      "EMAIL_NOT_CONFIGURED",
      "Invitation email is not configured yet. Set RESEND_API_KEY and EMAIL_FROM.",
      503,
    );
  }
  await enforceAuthLimit(`guest-invite:${weddingId}`, 5, 24 * 60 * 60 * 1000);
  const unique = [...new Set(recipients.map((email) => email.trim().toLowerCase()))];
  const results: {
    recipientEmail: string;
    status: "SENT" | "FAILED" | "ALREADY_SENT";
    message?: string;
  }[] = [];
  for (const recipientEmail of unique) {
    const existing = await repository.findByEmail(weddingId, recipientEmail);
    if (existing && existing.sendStatus !== "FAILED") {
      results.push({
        recipientEmail,
        status: "ALREADY_SENT",
        message: "An invitation already exists for this address.",
      });
      continue;
    }
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITE_LIFETIME_MS);
    let record;
    try {
      record = existing
        ? await repository.resetFailed(weddingId, recipientEmail, tokenHash(token), expiresAt)
        : await repository.createPending({
            weddingId,
            recipientEmail,
            tokenHash: tokenHash(token),
            expiresAt,
          });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        results.push({
          recipientEmail,
          status: "ALREADY_SENT",
          message: "An invitation already exists for this address.",
        });
        continue;
      }
      throw error;
    }
    if (!record) {
      results.push({ recipientEmail, status: "ALREADY_SENT" });
      continue;
    }
    const url = new URL(`/invitation/${token}`, emailEnv.NEXT_PUBLIC_APP_URL).toString();
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#291d1a"><h1>${escapeHtml(wedding.title)}</h1><p>You are warmly invited to celebrate with us.</p><p>Please tell us whether you can attend to open the full wedding invitation and venue details.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;background:#742b3b;color:white;text-decoration:none">Respond to invitation</a></p></div>`;
    let send: Awaited<ReturnType<ReturnType<typeof getEmailClient>["emails"]["send"]>>;
    try {
      send = await getEmailClient().emails.send({
        from: emailEnv.EMAIL_FROM,
        to: recipientEmail,
        subject: `You're invited: ${wedding.title}`,
        html,
      });
    } catch {
      await repository.markFailed(String(record._id), "PROVIDER_UNAVAILABLE");
      results.push({
        recipientEmail,
        status: "FAILED",
        message: "Email delivery was not accepted. Try again later.",
      });
      continue;
    }
    if (send.error || !send.data?.id) {
      await repository.markFailed(String(record._id), send.error?.name ?? "PROVIDER_FAILED");
      results.push({
        recipientEmail,
        status: "FAILED",
        message: "Email delivery was not accepted. Try again later.",
      });
    } else {
      await repository.markSent(String(record._id), send.data.id);
      results.push({ recipientEmail, status: "SENT" });
    }
  }
  return results;
}

export async function getGuestInvitation(token: string) {
  if (!TOKEN_PATTERN.test(token)) throw publicInviteError();
  await ready();
  const invitation = await repository.findByTokenHash(tokenHash(token));
  if (!invitation || invitation.sendStatus !== "SENT" || invitation.expiresAt <= new Date())
    throw publicInviteError();
  const wedding = await repository.findActiveWeddingById(String(invitation.weddingId));
  if (!wedding) throw publicInviteError();
  return { invitation, wedding };
}

export async function respondToGuestInvitation(token: string, response: "ATTENDING" | "DECLINED") {
  const { invitation, wedding } = await getGuestInvitation(token);
  if (invitation.response === "DECLINED") {
    throw new AppError("GUEST_RESPONSE_FINAL", "This invitation was already declined.", 409);
  }
  if (invitation.response === "ATTENDING" && response !== "ATTENDING") {
    throw new AppError("GUEST_RESPONSE_FINAL", "This invitation already has a response.", 409);
  }
  if (invitation.response === "PENDING") {
    const updated = await repository.respond(tokenHash(token), response);
    if (!updated)
      throw new AppError("GUEST_RESPONSE_FINAL", "This invitation already has a response.", 409);
  }
  return {
    slug: wedding.slug,
    weddingId: String(wedding._id),
    attending: response === "ATTENDING",
    expiresAt: invitation.expiresAt,
  };
}

export async function canViewWeddingDetails(
  weddingId: string,
  guestToken?: string,
  userId?: string,
) {
  await ready();
  if (userId && (await WeddingMemberModel.exists({ weddingId, userId, status: "ACTIVE" })))
    return true;
  return Boolean(await getAttendingGuestInvitation(weddingId, guestToken));
}

export async function getAttendingGuestInvitation(weddingId: string, guestToken?: string) {
  if (!guestToken || !TOKEN_PATTERN.test(guestToken)) return null;
  await ready();
  const invitation = await repository.findByTokenHash(tokenHash(guestToken));
  return invitation &&
    String(invitation.weddingId) === weddingId &&
    invitation.sendStatus === "SENT" &&
    invitation.response === "ATTENDING" &&
    invitation.expiresAt > new Date()
    ? { id: String(invitation._id) }
    : null;
}

export function emailDeliveryConfigured() {
  try {
    getEmailEnv();
    return true;
  } catch {
    return false;
  }
}
