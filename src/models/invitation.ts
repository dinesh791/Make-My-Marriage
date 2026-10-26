import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const invitationSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    templateKey: {
      type: String,
      enum: ["tamil-traditional"],
      required: true,
      default: "tamil-traditional",
    },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    revision: { type: Number, required: true, min: 1 },
    publishedMessage: { type: String, default: null, maxlength: 1000 },
    publishedRevision: { type: Number, required: true, default: 0 },
    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { collection: "invitations", timestamps: true, autoCreate: false, autoIndex: false },
);
invitationSchema.index(
  { weddingId: 1 },
  {
    unique: true,
    name: "invitations_wedding_active_unique",
    partialFilterExpression: { deletedAt: null },
  },
);
export type InvitationRecord = InferSchemaType<typeof invitationSchema>;
export const InvitationModel: Model<InvitationRecord> =
  (mongoose.models.Invitation as Model<InvitationRecord> | undefined) ??
  mongoose.model<InvitationRecord>("Invitation", invitationSchema);
