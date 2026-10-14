import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const authSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
  },
  { collection: "auth_sessions", timestamps: true, autoCreate: false, autoIndex: false },
);
authSessionSchema.index({ tokenHash: 1 }, { unique: true, name: "sessions_token_unique" });
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "sessions_expiry" });
authSessionSchema.index({ userId: 1 }, { name: "sessions_user" });

export type AuthSessionRecord = InferSchemaType<typeof authSessionSchema>;
export const AuthSessionModel: Model<AuthSessionRecord> =
  (mongoose.models.AuthSession as Model<AuthSessionRecord> | undefined) ??
  mongoose.model<AuthSessionRecord>("AuthSession", authSessionSchema);
