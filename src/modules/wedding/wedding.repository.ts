import "server-only";
import { WeddingModel } from "@/models/wedding";
import { WeddingMemberModel } from "@/models/wedding-member";

let indexesReady: Promise<void> | undefined;

export async function ensureWeddingStorage() {
  indexesReady ??= Promise.all([
    WeddingModel.collection.indexes(),
    WeddingMemberModel.collection.indexes(),
  ])
    .then(([weddings, members]) => {
      const activeMemberIndex = (name: string, key: Record<string, number>) =>
        members.some(
          (index) =>
            index.name === name &&
            index.unique &&
            index.partialFilterExpression?.status === "ACTIVE" &&
            Object.entries(key).every(([field, direction]) => index.key[field] === direction) &&
            Object.keys(index.key).length === Object.keys(key).length,
        );
      if (
        !weddings.some(
          (index) =>
            index.name === "weddings_slug_unique" &&
            index.unique &&
            index.key.slug === 1 &&
            Object.keys(index.key).length === 1,
        ) ||
        !activeMemberIndex("members_wedding_user_active", { weddingId: 1, userId: 1 }) ||
        !activeMemberIndex("members_wedding_role_active", { weddingId: 1, role: 1 }) ||
        !activeMemberIndex("members_user_active", { userId: 1 })
      ) {
        throw new Error("Wedding storage is not provisioned; run npm run db:setup.");
      }
    })
    .catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  await indexesReady;
}

export async function findActiveWeddingForUser(userId: string) {
  const membership = await WeddingMemberModel.findOne({ userId, status: "ACTIVE" }).lean();
  if (!membership) return null;
  return WeddingModel.findOne({ _id: membership.weddingId, status: "ACTIVE", deletedAt: null });
}

export async function findMemberWedding(weddingId: string, userId: string) {
  const membership = await WeddingMemberModel.findOne({
    weddingId,
    userId,
    status: "ACTIVE",
  }).lean();
  if (!membership) return null;
  return WeddingModel.findOne({ _id: weddingId, status: "ACTIVE", deletedAt: null });
}

export async function findPublicWeddingBySlug(slug: string) {
  return WeddingModel.findOne({ slug, status: "ACTIVE", deletedAt: null });
}

export async function updateWeddingDetails(
  weddingId: string,
  details: Partial<{
    title: string;
    brideName: string | null;
    groomName: string | null;
    story: string | null;
    weddingDate: Date;
    venueName: string;
    venueAddress: string;
    mapsUrl: string | null;
  }>,
) {
  return WeddingModel.findOneAndUpdate(
    { _id: weddingId, status: "ACTIVE", deletedAt: null },
    { $set: details },
    { new: true, runValidators: true },
  );
}

export async function createWeddingWithMember(
  userId: string,
  input: {
    slug: string;
    title: string;
    brideName: string | null;
    groomName: string | null;
    role: "BRIDE" | "GROOM";
    story: string | null;
    weddingDate: Date;
    venueName: string;
    venueAddress: string;
    mapsUrl: string | null;
  },
) {
  const db = await WeddingModel.db.startSession();
  try {
    let created: InstanceType<typeof WeddingModel> | null = null;
    await db.withTransaction(async () => {
      [created] = await WeddingModel.create(
        [
          {
            slug: input.slug,
            title: input.title,
            brideName: input.brideName,
            groomName: input.groomName,
            story: input.story,
            weddingDate: input.weddingDate,
            timezone: "Asia/Kolkata",
            venueName: input.venueName,
            venueAddress: input.venueAddress,
            mapsUrl: input.mapsUrl,
            status: "ACTIVE",
            deletedAt: null,
          },
        ],
        { session: db },
      );
      await WeddingMemberModel.create(
        [
          {
            weddingId: created._id,
            userId,
            role: input.role,
            status: "ACTIVE",
            joinedAt: new Date(),
          },
        ],
        { session: db },
      );
    });
    if (!created) throw new Error("WEDDING_TRANSACTION_EMPTY");
    return created;
  } finally {
    await db.endSession();
  }
}
