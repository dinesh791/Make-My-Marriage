import "server-only";
import { AppError } from "@/lib/http/errors";
import { getWeddingForMember } from "@/modules/wedding/wedding.service";
import { toPublicWeddingDto } from "@/modules/wedding/wedding.dto";
import { listPublishedEvents } from "@/modules/event/event.service";
import { toInvitationDraft, toPublishedInvitation } from "./invitation.dto";
import * as repository from "./invitation.repository";
import type { SaveInvitationInput } from "./invitation.validators";

function conflict() {
  return new AppError(
    "INVITATION_CHANGED",
    "This invitation was changed in another tab or by your partner. Reload the editor before saving or publishing.",
    409,
  );
}

export async function getMemberInvitation(weddingId: string, userId: string) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureInvitationStorage();
  return toInvitationDraft(await repository.findForWedding(weddingId));
}

export async function saveInvitationDraft(
  weddingId: string,
  userId: string,
  input: SaveInvitationInput,
) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureInvitationStorage();
  try {
    const saved = await repository.saveDraft(weddingId, input);
    if (!saved) throw conflict();
    return toInvitationDraft(saved);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000)
      throw conflict();
    throw error;
  }
}

export async function publishInvitation(weddingId: string, userId: string, revision: number) {
  await getWeddingForMember(weddingId, userId);
  await repository.ensureInvitationStorage();
  const draft = await repository.findForWedding(weddingId);
  if (!draft || draft.revision !== revision) throw conflict();
  if (draft.publishedRevision === revision) return toInvitationDraft(draft);
  const published = await repository.publishDraft(weddingId, revision, draft.message);
  if (!published) throw conflict();
  return toInvitationDraft(published);
}

export async function getInvitationPreview(weddingId: string, userId: string) {
  const wedding = await getWeddingForMember(weddingId, userId);
  const invitation = await getMemberInvitation(weddingId, userId);
  const events = await listPublishedEvents(weddingId);
  return { wedding: toPublicWeddingDto(wedding), invitation, events };
}

// Call only after resolving the active wedding and checking detail access.
export async function getPublishedInvitation(weddingId: string) {
  await repository.ensureInvitationStorage();
  return toPublishedInvitation(await repository.findForWedding(weddingId));
}
