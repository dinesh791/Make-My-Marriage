import "server-only";
import { GuestInvitationModel } from "@/models/guest-invitation";
import { WeddingModel } from "@/models/wedding";

let indexesReady: Promise<void> | undefined;

export async function ensureGuestInvitationStorage() {
  indexesReady ??= GuestInvitationModel.collection
    .indexes()
    .then((indexes) => {
      for (const [name, key] of [
        ["guest_invite_wedding_email_unique", { weddingId: 1, recipientEmail: 1 }],
        ["guest_invite_token_unique", { tokenHash: 1 }],
      ] as const) {
        if (
          !indexes.some(
            (index) =>
              index.name === name &&
              index.unique &&
              Object.entries(key).every(([field, direction]) => index.key[field] === direction) &&
              Object.keys(index.key).length === Object.keys(key).length,
          )
        ) {
          throw new Error("Guest invitation storage is not provisioned; run npm run db:setup.");
        }
      }
    })
    .catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  await indexesReady;
}

export function listForWedding(weddingId: string) {
  return GuestInvitationModel.find({ weddingId }).sort({ createdAt: -1 }).lean();
}

export function findByTokenHash(tokenHash: string) {
  return GuestInvitationModel.findOne({ tokenHash }).lean();
}

export function findActiveWeddingById(weddingId: string) {
  return WeddingModel.findOne({ _id: weddingId, status: "ACTIVE", deletedAt: null });
}

export function findByEmail(weddingId: string, recipientEmail: string) {
  return GuestInvitationModel.findOne({ weddingId, recipientEmail }).lean();
}

export function createPending(input: {
  weddingId: string;
  recipientEmail: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return GuestInvitationModel.create({ ...input, sendStatus: "PENDING", response: "PENDING" });
}

export function markSent(id: string, resendMessageId: string) {
  return GuestInvitationModel.updateOne(
    { _id: id, sendStatus: "PENDING" },
    {
      $set: {
        sendStatus: "SENT",
        resendMessageId,
        sentAt: new Date(),
        failedAt: null,
        errorCode: null,
      },
    },
  );
}

export function markFailed(id: string, errorCode: string) {
  return GuestInvitationModel.updateOne(
    { _id: id, sendStatus: "PENDING" },
    { $set: { sendStatus: "FAILED", failedAt: new Date(), errorCode } },
  );
}

export function resetFailed(
  weddingId: string,
  recipientEmail: string,
  tokenHash: string,
  expiresAt: Date,
) {
  return GuestInvitationModel.findOneAndUpdate(
    { weddingId, recipientEmail, sendStatus: "FAILED", response: "PENDING" },
    { $set: { tokenHash, expiresAt, sendStatus: "PENDING", failedAt: null, errorCode: null } },
    { new: true },
  );
}

export function respond(tokenHash: string, response: "ATTENDING" | "DECLINED") {
  return GuestInvitationModel.findOneAndUpdate(
    { tokenHash, sendStatus: "SENT", response: "PENDING", expiresAt: { $gt: new Date() } },
    { $set: { response, respondedAt: new Date() } },
    { new: true },
  );
}
