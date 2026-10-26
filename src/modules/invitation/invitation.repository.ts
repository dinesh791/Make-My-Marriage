import "server-only";
import { InvitationModel } from "@/models/invitation";
import type { SaveInvitationInput } from "./invitation.validators";

let indexesReady: Promise<void> | undefined;
export async function ensureInvitationStorage() {
  indexesReady ??= InvitationModel.collection
    .indexes()
    .then((indexes) => {
      if (
        !indexes.some(
          (index) =>
            index.name === "invitations_wedding_active_unique" &&
            index.unique &&
            index.key.weddingId === 1 &&
            Object.keys(index.key).length === 1 &&
            index.partialFilterExpression?.deletedAt === null,
        )
      ) {
        throw new Error("Invitation storage is not provisioned; run npm run db:setup.");
      }
    })
    .catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  await indexesReady;
}

export function findForWedding(weddingId: string) {
  return InvitationModel.findOne({ weddingId, deletedAt: null }).lean();
}

export function saveDraft(weddingId: string, input: SaveInvitationInput) {
  if (input.revision === 0) {
    return InvitationModel.create({ weddingId, message: input.message, revision: 1 });
  }
  return InvitationModel.findOneAndUpdate(
    { weddingId, deletedAt: null, revision: input.revision },
    { $set: { message: input.message }, $inc: { revision: 1 } },
    { returnDocument: "after", runValidators: true },
  );
}

export function publishDraft(weddingId: string, revision: number, message: string) {
  return InvitationModel.findOneAndUpdate(
    { weddingId, deletedAt: null, revision },
    { $set: { publishedMessage: message, publishedRevision: revision, publishedAt: new Date() } },
    { returnDocument: "after", runValidators: true },
  );
}
