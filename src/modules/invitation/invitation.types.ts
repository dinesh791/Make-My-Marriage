export const TRADITIONAL_TAMIL_TEMPLATE = "tamil-traditional" as const;
export const DEFAULT_INVITATION_MESSAGE =
  "We warmly invite you to join us and share your blessings on our wedding day.";

export type InvitationContent = {
  templateKey: typeof TRADITIONAL_TAMIL_TEMPLATE;
  message: string;
};

export type InvitationDraft = InvitationContent & {
  revision: number;
  publishedRevision: number;
  publishedAt: string | null;
};
