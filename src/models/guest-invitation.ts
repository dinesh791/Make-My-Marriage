import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const guestInvitationSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    recipientEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    sendStatus: { type: String, enum: ["PENDING", "SENT", "FAILED"], required: true },
    response: {
      type: String,
      enum: ["PENDING", "ATTENDING", "DECLINED"],
      default: "PENDING",
      required: true,
    },
    respondedAt: { type: Date, default: null },
    resendMessageId: { type: String, default: null },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    errorCode: { type: String, default: null },
  },
  { collection: "guest_invitations", timestamps: true, autoCreate: false, autoIndex: false },
);

guestInvitationSchema.index(
  { weddingId: 1, recipientEmail: 1 },
  { unique: true, name: "guest_invite_wedding_email_unique" },
);
guestInvitationSchema.index({ tokenHash: 1 }, { unique: true, name: "guest_invite_token_unique" });
guestInvitationSchema.index(
  { weddingId: 1, createdAt: -1 },
  { name: "guest_invite_wedding_created" },
);

export type GuestInvitationRecord = InferSchemaType<typeof guestInvitationSchema>;
export const GuestInvitationModel: Model<GuestInvitationRecord> =
  (mongoose.models.GuestInvitation as Model<GuestInvitationRecord> | undefined) ??
  mongoose.model<GuestInvitationRecord>("GuestInvitation", guestInvitationSchema);
