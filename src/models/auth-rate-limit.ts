import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const authRateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    attempts: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { collection: "auth_rate_limits", versionKey: false, autoCreate: false, autoIndex: false },
);
authRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "auth_limits_expiry" });

export type AuthRateLimitRecord = InferSchemaType<typeof authRateLimitSchema>;
export const AuthRateLimitModel: Model<AuthRateLimitRecord> =
  (mongoose.models.AuthRateLimit as Model<AuthRateLimitRecord> | undefined) ??
  mongoose.model<AuthRateLimitRecord>("AuthRateLimit", authRateLimitSchema);
