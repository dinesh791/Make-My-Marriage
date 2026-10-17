import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const weddingPartnerInviteSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    invitedByUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    targetRole: { type: String, enum: ["BRIDE", "GROOM"], required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { collection: "wedding_partner_invites", timestamps: true, autoCreate: false, autoIndex: false },
);

weddingPartnerInviteSchema.index(
  { tokenHash: 1 },
  { unique: true, name: "partner_invites_token_unique" },
);
weddingPartnerInviteSchema.index(
  { weddingId: 1, targetRole: 1 },
  {
    unique: true,
    partialFilterExpression: { usedAt: null, revokedAt: null },
    name: "partner_invites_pending_role_unique",
  },
);

export type WeddingPartnerInviteRecord = InferSchemaType<typeof weddingPartnerInviteSchema>;
export const WeddingPartnerInviteModel: Model<WeddingPartnerInviteRecord> =
  (mongoose.models.WeddingPartnerInvite as Model<WeddingPartnerInviteRecord> | undefined) ??
  mongoose.model<WeddingPartnerInviteRecord>("WeddingPartnerInvite", weddingPartnerInviteSchema);
