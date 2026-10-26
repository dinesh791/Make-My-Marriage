import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import nextEnv from "@next/env";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user.ts";
import { AuthSessionModel } from "../src/models/auth-session.ts";
import { WeddingModel } from "../src/models/wedding.ts";
import { WeddingMemberModel } from "../src/models/wedding-member.ts";
import { EventModel } from "../src/models/event.ts";
import { GuestInvitationModel } from "../src/models/guest-invitation.ts";
import { InvitationModel } from "../src/models/invitation.ts";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const fixturePath = ".local/event-check.json";
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const base = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
const database = new URL(process.env.MONGODB_URI);
assert.ok(["localhost", "127.0.0.1"].includes(base.hostname));
assert.equal(database.hostname, "127.0.0.1");
assert.equal(database.port, "27018");
assert.equal(database.pathname, "/makemymarriage_dev");
assert.match(fixture.email, /^event-check-.+@example\.invalid$/);
assert.match(fixture.wedding.slug, /^disposable-event-check-/);
const weddingId = fixture.wedding.id;
const path = `/api/v1/weddings/${weddingId}/invitation`;
const publicPath = `/api/v1/public/weddings/${fixture.wedding.slug}/invitation`;
const hash = (value) => createHmac("sha256", process.env.AUTH_SECRET).update(value).digest("hex");
let completed = false;

async function call(url, { method = "GET", body, cookie, origin = base.origin } = {}) {
  return fetch(new URL(url, base), {
    method,
    headers: {
      origin,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(90_000),
  });
}
async function json(url, options, status = 200) {
  const response = await call(url, options);
  assert.equal(response.status, status, `${options?.method ?? "GET"} ${url}`);
  return (await response.json()).data;
}

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    autoCreate: false,
    autoIndex: false,
    serverSelectionTimeoutMS: 3000,
  });
  assert.ok(await WeddingModel.exists({ _id: weddingId, slug: fixture.wedding.slug }));
  const userId = fixture.userIds[0];
  const token = randomBytes(32).toString("base64url");
  await AuthSessionModel.create({
    userId,
    tokenHash: hash(`session:${token}`),
    expiresAt: new Date(Date.now() + 3600000),
  });
  const cookie = `mmm_session=${token}`;
  const guestToken = randomBytes(32).toString("base64url");
  await GuestInvitationModel.create({
    weddingId,
    recipientEmail: `invitation-check-${randomBytes(5).toString("hex")}@example.invalid`,
    tokenHash: hash(`guest-invitation:${guestToken}`),
    expiresAt: new Date(Date.now() + 3600000),
    sendStatus: "SENT",
    response: "PENDING",
  });
  const guestCookie = `mmm_guest_${weddingId}=${guestToken}`;
  const declinedToken = randomBytes(32).toString("base64url");
  await GuestInvitationModel.create({
    weddingId,
    recipientEmail: `declined-invitation-${randomBytes(5).toString("hex")}@example.invalid`,
    tokenHash: hash(`guest-invitation:${declinedToken}`),
    expiresAt: new Date(Date.now() + 3600000),
    sendStatus: "SENT",
    response: "PENDING",
  });
  await json(`/api/v1/guest-invitations/${declinedToken}/respond`, {
    method: "POST",
    body: { response: "DECLINED" },
  });
  assert.equal((await json(publicPath)).invitation, null);
  assert.equal(
    (await json(publicPath, { cookie: `mmm_guest_${weddingId}=${declinedToken}` })).invitation,
    null,
  );
  assert.equal(await json(path, {}, 401), undefined);
  const initial = (await json(path, { cookie })).invitation;
  assert.equal(initial.revision, 0);
  assert.equal(initial.publishedRevision, 0);
  const draftOne = "PRIVATE DRAFT FIRST — please keep this hidden";
  const savedOne = (
    await json(path, { method: "PATCH", cookie, body: { message: draftOne, revision: 0 } })
  ).invitation;
  assert.equal(savedOne.revision, 1);
  assert.notEqual((await json(publicPath, { cookie })).invitation.message, draftOne);
  assert.equal((await json(publicPath, { cookie: guestCookie })).invitation, null);
  const before = await (await call(`/w/${fixture.wedding.slug}`, { cookie })).text();
  assert.ok(!before.includes(draftOne));
  await json(`/api/v1/guest-invitations/${guestToken}/respond`, {
    method: "POST",
    body: { response: "ATTENDING" },
  });
  assert.notEqual((await json(publicPath, { cookie: guestCookie })).invitation.message, draftOne);
  const publishedOne = (
    await json(`${path}/publish`, { method: "POST", cookie, body: { revision: 1 } })
  ).invitation;
  assert.equal(publishedOne.publishedRevision, 1);
  assert.equal((await json(publicPath, { cookie: guestCookie })).invitation.message, draftOne);
  const draftTwo = "SECOND PRIVATE DRAFT — not published yet";
  const savedTwo = (
    await json(path, { method: "PATCH", cookie, body: { message: draftTwo, revision: 1 } })
  ).invitation;
  assert.equal(savedTwo.revision, 2);
  assert.equal(savedTwo.publishedRevision, 1);
  assert.equal((await json(publicPath, { cookie: guestCookie })).invitation.message, draftOne);
  assert.equal((await json(`${path}/preview`, { cookie })).invitation.message, draftTwo);
  const guestHtml = await (
    await call(`/w/${fixture.wedding.slug}`, { cookie: guestCookie })
  ).text();
  assert.ok(guestHtml.includes(draftOne));
  assert.ok(!guestHtml.includes(draftTwo));
  await json(path, { method: "PATCH", cookie, body: { message: "stale", revision: 1 } }, 409);
  await json(`${path}/publish`, { method: "POST", cookie, body: { revision: 1 } }, 409);
  await json(path, { method: "PATCH", cookie, body: { message: "", revision: 2 } }, 422);
  await json(
    path,
    {
      method: "PATCH",
      cookie,
      origin: "https://other.example",
      body: { message: "bad origin", revision: 2 },
    },
    403,
  );
  await json(`${path}/publish`, { method: "POST", cookie, body: { revision: 2 } });
  assert.equal((await json(publicPath, { cookie: guestCookie })).invitation.message, draftTwo);
  const editor = await call("/dashboard/invitation", { cookie });
  assert.equal(editor.status, 200);
  assert.ok((await editor.text()).includes("Draft preview"));
  completed = true;
  console.log(
    "Invitation draft, publish, privacy, conflict, validation, origin and editor checks passed.",
  );
} finally {
  if (mongoose.connection.readyState === 1) {
    await InvitationModel.deleteMany({ weddingId });
    await EventModel.deleteMany({ weddingId });
    await GuestInvitationModel.deleteMany({ weddingId });
    await WeddingMemberModel.deleteMany({ weddingId });
    await WeddingModel.deleteOne({ _id: weddingId });
    await AuthSessionModel.deleteMany({ userId: { $in: fixture.userIds } });
    await UserModel.deleteMany({
      _id: { $in: fixture.userIds },
      email: /^event-check-.+@example\.invalid$/,
    });
    await mongoose.disconnect();
    await unlink(fixturePath);
    console.log("Disposable local event and invitation fixtures removed.");
  }
  if (!completed) process.exitCode = 1;
}
