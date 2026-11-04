import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const short = { type: String, default: "", maxlength: 120 };
const menu = { type: String, default: "", maxlength: 2000 };
export const cateringSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
    foodType: { type: String, enum: ["", "VEGETARIAN", "NON_VEGETARIAN", "MIXED"], default: "" },
    breakfast: menu,
    lunch: menu,
    dinner: menu,
    snacks: menu,
    notes: menu,
    catererName: short,
    contactPerson: short,
    phone: { type: String, default: "", maxlength: 30 },
    email: { type: String, default: "", maxlength: 254 },
    deletedAt: { type: Date, default: null },
  },
  { collection: "catering", timestamps: true, autoCreate: false, autoIndex: false },
);
cateringSchema.index(
  { weddingId: 1 },
  {
    name: "catering_active_wedding_unique",
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
type Record = InferSchemaType<typeof cateringSchema>;
export const CateringModel: Model<Record> =
  (mongoose.models.Catering as Model<Record> | undefined) ??
  mongoose.model("Catering", cateringSchema);
