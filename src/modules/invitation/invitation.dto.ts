import type { InvitationRecord } from "@/models/invitation";
import {
  DEFAULT_INVITATION_MESSAGE,
  TRADITIONAL_TAMIL_TEMPLATE,
  type InvitationDraft,
  type InvitationContent,
} from "./invitation.types";

export function toInvitationDraft(record: InvitationRecord | null): InvitationDraft {
  return {
    templateKey: TRADITIONAL_TAMIL_TEMPLATE,
    message: record?.message ?? DEFAULT_INVITATION_MESSAGE,
    revision: record?.revision ?? 0,
    publishedRevision: record?.publishedRevision ?? 0,
    publishedAt: record?.publishedAt?.toISOString() ?? null,
  };
}

export function toPublishedInvitation(record: InvitationRecord | null): InvitationContent {
  return {
    templateKey: TRADITIONAL_TAMIL_TEMPLATE,
    message: record?.publishedMessage ?? DEFAULT_INVITATION_MESSAGE,
  };
}
