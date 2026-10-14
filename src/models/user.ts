import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const userSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    emailVerifiedAt: { type: Date, default: null },
    passwordHash: { type: String, default: null, select: false },
    // Omit absent Google subjects: a sparse unique index still indexes explicit null.
    googleSubject: { type: String, default: undefined, select: false },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, default: null, trim: true, maxlength: 100 },
    profilePhotoKey: { type: String, default: null },
    locale: { type: String, enum: ["en", "ta"], default: "en", required: true },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE", required: true },
    deletedAt: { type: Date, default: null },
  },
  { collection: "users", timestamps: true, autoCreate: false, autoIndex: false },
);

// Identity identifiers remain reserved after soft deletion; see docs/AUTH_DESIGN.md.
userSchema.index({ email: 1 }, { unique: true, name: "users_email_unique" });
userSchema.index({ googleSubject: 1 }, { unique: true, sparse: true, name: "users_google_unique" });

export type UserRecord = InferSchemaType<typeof userSchema>;
export const UserModel: Model<UserRecord> =
  (mongoose.models.User as Model<UserRecord> | undefined) ??
  mongoose.model<UserRecord>("User", userSchema);
