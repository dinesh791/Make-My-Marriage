// Disposable local-only HTTP check for the livestream member and public flows.
import assert from "node:assert/strict";
import { randomBytes, createHmac } from "node:crypto";
import { GuestInvitationModel } from "../src/models/guest-invitation.ts";
import nextEnv from "@next/env";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user.ts";
import { AuthSessionModel } from "../src/models/auth-session.ts";
import { WeddingModel } from "../src/models/wedding.ts";
import { WeddingMemberModel } from "../src/models/wedding-member.ts";
import { LivestreamModel } from "../src/models/livestream.ts";
import { verifyServerDatabase } from "./verify-server-database.mjs";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const base = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
const database = new URL(process.env.MONGODB_URI ?? "mongodb://invalid/");
if (!(
  ["localhost", "127.0.0.1"].includes(base.hostname) &&
  database.hostname === "127.0.0.1" &&
  database.port === "27018" &&
  database.pathname === "/makemymarriage_dev"
)) {
  console.error("Refusing livestream check outside the local development app and database.");
  process.exit(1);
}
const email = `livestream-check-${randomBytes(12).toString("hex")}@example.invalid`;
const password = randomBytes(24).toString("base64url");
let step = "connect";
async function call(path, { method = "GET", body, cookie } = {}) {
  const headers = { origin: base.origin };
  if (body) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  return fetch(new URL(path, base), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
}
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    autoCreate: false,
    autoIndex: false,
    serverSelectionTimeoutMS: 3000,
  });
  await verifyServerDatabase(base);
  step = "register";
  const registered = await call("/api/v1/auth/register", {
    method: "POST",
    body: { firstName: "Livestream Check", email, password },
  });
  assert.equal(registered.status, 201);
  const cookie = registered.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  step = "create wedding";
  const created = await call("/api/v1/weddings", {
    method: "POST",
    cookie,
    body: {
      title: "Local Livestream Check",
      role: "BRIDE",
      weddingDate: "2027-01-20T00:00:00.000Z",
      venueName: "Test venue",
      venueAddress: "PRIVATE_ADDRESS_LIVESTREAM_TEST",
      story: "PRIVATE_STORY_LIVESTREAM_TEST",
    },
  });
  assert.equal(created.status, 201);
  const { wedding } = (await created.json()).data;
  const memberPath = `/api/v1/weddings/${wedding.id}/livestream`;
  const publicPath = `/api/v1/public/weddings/${wedding.slug}/livestream`;
  step = "member access and save";
  assert.equal((await call(memberPath)).status, 401);
  assert.equal((await (await call(memberPath, { cookie })).json()).data.livestream, null);
  const input = {
    title: "Muhurtham live",
    playbackUrl: "https://www.youtube.com/watch?v=example",
    enabled: false,
  };
  assert.equal((await call(memberPath, { method: "PUT", cookie, body: input })).status, 200);
  assert.equal(
    (
      await call(memberPath, {
        method: "PUT",
        cookie,
        body: { ...input, playbackUrl: "javascript:alert(1)" },
      })
    ).status,
    422,
  );
  assert.equal(
    (await (await call(memberPath, { cookie })).json()).data.livestream.title,
    input.title,
  );
  assert.equal(await LivestreamModel.countDocuments({ weddingId: wedding.id, deletedAt: null }), 1);
  step = "public gate";
  assert.equal((await call(publicPath)).status, 403);
  assert.equal((await (await call(publicPath, { cookie })).json()).data.livestream, null);
  assert.equal(
    (await call(memberPath, { method: "PUT", cookie, body: { ...input, enabled: true } })).status,
    200,
  );
  assert.equal((await call(publicPath)).status, 403);
  assert.equal(
    (await (await call(publicPath, { cookie })).json()).data.livestream.playbackUrl,
    input.playbackUrl,
  );
  const publicPage = await call(`/w/${wedding.slug}`, { cookie });
  assert.equal(publicPage.status, 200);
  assert.match(await publicPage.text(), /Muhurtham live/);
  const anonymousPage = await call(`/w/${wedding.slug}`);
  assert.equal(anonymousPage.status, 200);
  assert.doesNotMatch(await anonymousPage.text(), /Muhurtham live/);
  step = "online RSVP";
  const token = randomBytes(32).toString("base64url");
  await GuestInvitationModel.create({
    weddingId: wedding.id,
    recipientEmail: email,
    tokenHash: createHmac("sha256", process.env.AUTH_SECRET)
      .update(`guest-invitation:${token}`)
      .digest("hex"),
    sendStatus: "SENT",
    response: "PENDING",
    expiresAt: new Date(Date.now() + 3600000),
  });
  const rsvp = await call(`/api/v1/guest-invitations/${token}/respond`, {
    method: "POST",
    body: { response: "WATCHING_ONLINE" },
  });
  assert.equal(rsvp.status, 200);
  const guestCookie = rsvp.headers.get("set-cookie")?.split(";")[0];
  assert.ok(guestCookie);
  assert.equal((await rsvp.json()).data.attending, false);
  assert.equal((await call(publicPath, { cookie: guestCookie })).status, 200);
  const lockedInvitation = await call(`/api/v1/public/weddings/${wedding.slug}/invitation`, {
    cookie: guestCookie,
  });
  assert.equal(lockedInvitation.status, 200);
  assert.equal((await lockedInvitation.json()).data.invitation, null);
  const onlinePage = await call(`/w/${wedding.slug}`, { cookie: guestCookie });
  assert.equal(onlinePage.status, 200);
  const onlinePageHtml = await onlinePage.text();
  assert.match(onlinePageHtml, /Muhurtham live/);
  assert.doesNotMatch(onlinePageHtml, /PRIVATE_ADDRESS_LIVESTREAM_TEST|PRIVATE_STORY_LIVESTREAM_TEST/);
  assert.equal(
    (await GuestInvitationModel.findOne({ weddingId: wedding.id }).lean()).response,
    "WATCHING_ONLINE",
  );
  step = "remove";
  assert.equal((await call(memberPath, { method: "DELETE", cookie })).status, 200);
  assert.equal((await (await call(memberPath, { cookie })).json()).data.livestream, null);
  console.log("PASS: livestream save, validation, RSVP gate, visible page, and removal.");
} catch (error) {
  console.error(
    `FAIL at ${step} (${error?.name}). ${error instanceof assert.AssertionError && typeof error.actual === "number" ? `Expected ${error.expected}, received ${error.actual}.` : "Sensitive diagnostics suppressed."}`,
  );
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await UserModel.findOne({ email }).select("_id").lean();
      if (user) {
        const members = await WeddingMemberModel.find({ userId: user._id })
          .select("weddingId")
          .lean();
        const weddingIds = members.map((member) => member.weddingId);
        await LivestreamModel.deleteMany({ weddingId: { $in: weddingIds } });
        await GuestInvitationModel.deleteMany({ weddingId: { $in: weddingIds } });
        await WeddingMemberModel.deleteMany({ userId: user._id });
        await WeddingModel.deleteMany({ _id: { $in: weddingIds } });
        await AuthSessionModel.deleteMany({ userId: user._id });
        await UserModel.deleteOne({ _id: user._id });
        console.log("Temporary local livestream wedding and account removed.");
      }
    } catch {
      console.error("Temporary livestream check cleanup failed; inspect livestream-check records.");
      process.exitCode = 1;
    }
  }
  await mongoose.disconnect();
}
