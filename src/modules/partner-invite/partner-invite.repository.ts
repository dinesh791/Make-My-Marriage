import "server-only";
import { WeddingModel } from "@/models/wedding";
import { WeddingMemberModel } from "@/models/wedding-member";
import { WeddingPartnerInviteModel } from "@/models/wedding-partner-invite";

let indexesReady: Promise<void> | undefined;

export async function ensurePartnerInviteStorage() {
  indexesReady ??= WeddingPartnerInviteModel.collection
    .indexes()
    .then((indexes) => {
      if (
        !indexes.some(
          (index) =>
            index.name === "partner_invites_token_unique" &&
            index.unique &&
            index.key.tokenHash === 1,
        ) ||
        !indexes.some(
          (index) =>
            index.name === "partner_invites_pending_role_unique" &&
            index.unique &&
            index.key.weddingId === 1 &&
            index.key.targetRole === 1 &&
            index.partialFilterExpression?.usedAt === null &&
            index.partialFilterExpression?.revokedAt === null,
        )
      ) {
        throw new Error("Partner invite storage is not provisioned; run npm run db:setup.");
      }
    })
    .catch((error) => {
      indexesReady = undefined;
      throw error;
    });
  await indexesReady;
}

export function findMembership(weddingId: string, userId: string) {
  return WeddingMemberModel.findOne({ weddingId, userId, status: "ACTIVE" }).lean();
}

export function findRoleMember(weddingId: string, role: "BRIDE" | "GROOM") {
  return WeddingMemberModel.findOne({ weddingId, role, status: "ACTIVE" }).lean();
}

export function findInvite(tokenHash: string) {
  return WeddingPartnerInviteModel.findOne({ tokenHash }).lean();
}

export async function rotateInvite(input: {
  weddingId: string;
  userId: string;
  role: "BRIDE" | "GROOM";
  tokenHash: string;
  expiresAt: Date;
}) {
  const session = await WeddingPartnerInviteModel.db.startSession();
  try {
    await session.withTransaction(async () => {
      const wedding = await WeddingModel.findOne({
        _id: input.weddingId,
        status: "ACTIVE",
        deletedAt: null,
      }).session(session);
      const member = await WeddingMemberModel.findOne({
        weddingId: input.weddingId,
        userId: input.userId,
        status: "ACTIVE",
      }).session(session);
      const partner = await WeddingMemberModel.findOne({
        weddingId: input.weddingId,
        role: input.role,
        status: "ACTIVE",
      }).session(session);
      if (!wedding || !member) throw new Error("INVITE_WEDDING_MISSING");
      if (partner || member.role === input.role) throw new Error("INVITE_ROLE_UNAVAILABLE");
      await WeddingPartnerInviteModel.updateMany(
        { weddingId: input.weddingId, usedAt: null, revokedAt: null },
        { $set: { revokedAt: new Date() } },
        { session },
      );
      await WeddingPartnerInviteModel.create(
        [
          {
            weddingId: input.weddingId,
            invitedByUserId: input.userId,
            targetRole: input.role,
            tokenHash: input.tokenHash,
            expiresAt: input.expiresAt,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function acceptInvite(tokenHash: string, userId: string) {
  const session = await WeddingPartnerInviteModel.db.startSession();
  try {
    await session.withTransaction(async () => {
      const now = new Date();
      const invite = await WeddingPartnerInviteModel.findOne({
        tokenHash,
        usedAt: null,
        revokedAt: null,
        expiresAt: { $gt: now },
      }).session(session);
      if (!invite) throw new Error("INVITE_UNAVAILABLE");
      const wedding = await WeddingModel.findOne({
        _id: invite.weddingId,
        status: "ACTIVE",
        deletedAt: null,
      }).session(session);
      if (!wedding) throw new Error("INVITE_UNAVAILABLE");
      if (String(invite.invitedByUserId) === userId) throw new Error("INVITE_SELF");
      if (await WeddingMemberModel.findOne({ userId, status: "ACTIVE" }).session(session)) {
        throw new Error("INVITE_ALREADY_MEMBER");
      }
      if (
        await WeddingMemberModel.findOne({
          weddingId: invite.weddingId,
          role: invite.targetRole,
          status: "ACTIVE",
        }).session(session)
      ) {
        throw new Error("INVITE_ROLE_UNAVAILABLE");
      }
      const claimed = await WeddingPartnerInviteModel.updateOne(
        { _id: invite._id, usedAt: null, revokedAt: null, expiresAt: { $gt: now } },
        { $set: { usedAt: now } },
        { session },
      );
      if (claimed.modifiedCount !== 1) throw new Error("INVITE_UNAVAILABLE");
      await WeddingMemberModel.create(
        [
          {
            weddingId: invite.weddingId,
            userId,
            role: invite.targetRole,
            status: "ACTIVE",
            joinedAt: now,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}
