import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const weddingMemberSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    role: { type: String, enum: ["BRIDE", "GROOM"], required: true },
    status: { type: String, enum: ["ACTIVE", "REMOVED"], default: "ACTIVE", required: true },
    joinedAt: { type: Date, required: true, default: Date.now },
  },
  { collection: "wedding_members", timestamps: true, autoCreate: false, autoIndex: false },
);

weddingMemberSchema.index(
  { weddingId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "ACTIVE" },
    name: "members_wedding_user_active",
  },
);
weddingMemberSchema.index(
  { weddingId: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "ACTIVE" },
    name: "members_wedding_role_active",
  },
);
// The V1 rule is one active wedding per account. The unique partial index also closes race conditions.
weddingMemberSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" }, name: "members_user_active" },
);

export type WeddingMemberRecord = InferSchemaType<typeof weddingMemberSchema>;
export const WeddingMemberModel: Model<WeddingMemberRecord> =
  (mongoose.models.WeddingMember as Model<WeddingMemberRecord> | undefined) ??
  mongoose.model<WeddingMemberRecord>("WeddingMember", weddingMemberSchema);
