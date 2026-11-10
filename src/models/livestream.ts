import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const livestreamSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    title: { type: String, required: true, maxlength: 120 },
    playbackUrl: { type: String, required: true, maxlength: 2000 },
    enabled: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, default: null },
  },
  { collection: "livestreams", timestamps: true, autoCreate: false, autoIndex: false },
);
livestreamSchema.index(
  { weddingId: 1 },
  {
    name: "livestream_active_wedding_unique",
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
type Record = InferSchemaType<typeof livestreamSchema>;
export const LivestreamModel: Model<Record> =
  (mongoose.models.Livestream as Model<Record> | undefined) ??
  mongoose.model("Livestream", livestreamSchema);
