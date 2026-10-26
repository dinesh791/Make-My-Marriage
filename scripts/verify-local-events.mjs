import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
import mongoose from "mongoose";
import argon2 from "argon2";
import { UserModel } from "../src/models/user.ts";
import { AuthSessionModel } from "../src/models/auth-session.ts";
import { WeddingModel } from "../src/models/wedding.ts";
import { WeddingMemberModel } from "../src/models/wedding-member.ts";
import { EventModel } from "../src/models/event.ts";
import { GuestInvitationModel } from "../src/models/guest-invitation.ts";
import { verifyServerDatabase } from "./verify-server-database.mjs";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const base = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
const database = new URL(process.env.MONGODB_URI);
assert.ok(["localhost", "127.0.0.1"].includes(base.hostname));
assert.equal(database.hostname, "127.0.0.1");
assert.equal(database.port, "27018");
assert.equal(database.pathname, "/makemymarriage_dev");
const hash = (value) => createHmac("sha256", process.env.AUTH_SECRET).update(value).digest("hex");
const users = [];
let wedding;
let completed = false;
const keep = process.argv.includes("--keep");
async function call(path, { method = "GET", body, cookie } = {}) {
  return fetch(new URL(path, base), {
    method,
    headers: {
      origin: base.origin,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(90_000),
  });
}
async function json(path, options, status = 200) {
  const response = await call(path, options);
  assert.equal(response.status, status, `${options?.method ?? "GET"} ${path}`);
  return (await response.json()).data;
}
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    autoCreate: false,
    autoIndex: false,
    serverSelectionTimeoutMS: 3000,
  });
  await verifyServerDatabase(base);
  const password = randomBytes(24).toString("base64url");
  for (let i = 0; i < 2; i++) {
    const user = await UserModel.create({
      email: `event-check-${randomBytes(10).toString("hex")}@example.invalid`,
      firstName: "Event Check",
      passwordHash: await argon2.hash(password),
    });
    users.push(user);
  }
  const cookies = [];
  for (const user of users) {
    const token = randomBytes(32).toString("base64url");
    await AuthSessionModel.create({
      userId: user._id,
      tokenHash: hash(`session:${token}`),
      expiresAt: new Date(Date.now() + 3600000),
    });
    cookies.push(`mmm_session=${token}`);
  }
  const cookie = cookies[0];
  ({ wedding } = await json(
    "/api/v1/weddings",
    {
      method: "POST",
      cookie,
      body: {
        title: "Disposable Event Check",
        role: "BRIDE",
        weddingDate: "2027-01-20T00:00:00.000Z",
        venueName: "QA Venue",
        venueAddress: "QA wedding address",
      },
    },
    201,
  ));
  const path = `/api/v1/weddings/${wedding.id}/events`;
  const initial = await json(path, { cookie });
  assert.equal(initial.events.length, 4);
  assert.ok(initial.events.every((event) => !event.enabled && event.startsAt === null));
  const draft = {
    startsAt: null,
    endsAt: null,
    venueName: "QA event venue",
    address: "QA PRIVATE EVENT ADDRESS",
    mapsUrl: null,
    description: "QA EVENT DRAFT SECRET",
    enabled: false,
  };
  await json(`${path}/NALANGU`, { method: "PUT", cookie, body: draft });
  await json(`${path}/NALANGU`, { method: "PUT", cookie, body: { ...draft, enabled: true } }, 422);
  const published = {
    ...draft,
    startsAt: "2027-01-19T18:00:00+05:30",
    description: "QA PUBLISHED EVENT",
    enabled: true,
  };
  await json(`${path}/MUHURTHAM`, { method: "PUT", cookie, body: published });
  await json(path, {}, 401);
  await json(path, { cookie: cookies[1] }, 404);
  await json(`${path}/MUHURTHAM`, { method: "PUT", cookie: cookies[1], body: published }, 404);
  assert.equal(
    (await json(`/api/v1/weddings/${wedding.id}`, { cookie })).wedding.weddingDate,
    wedding.weddingDate,
  );
  const publicPath = `/api/v1/public/weddings/${wedding.slug}/events`;
  assert.equal((await json(publicPath)).events.length, 0);
  assert.equal((await json(publicPath, { cookie })).events.length, 1);
  let attendingCookie;
  for (const response of ["DECLINED", "ATTENDING"]) {
    const token = randomBytes(32).toString("base64url");
    await GuestInvitationModel.create({
      weddingId: wedding.id,
      recipientEmail: `${response.toLowerCase()}@example.invalid`,
      tokenHash: hash(`guest-invitation:${token}`),
      expiresAt: new Date(Date.now() + 3600000),
      sendStatus: "SENT",
      response: "PENDING",
    });
    const replied = await call(`/api/v1/guest-invitations/${token}/respond`, {
      method: "POST",
      body: { response },
    });
    assert.equal(replied.status, 200);
    const guestCookie = `mmm_guest_${wedding.id}=${token}`;
    assert.equal(
      (await json(publicPath, { cookie: guestCookie })).events.length,
      response === "ATTENDING" ? 1 : 0,
    );
    const html = await (await call(`/w/${wedding.slug}`, { cookie: guestCookie })).text();
    assert.equal(html.includes("QA PRIVATE EVENT ADDRESS"), response === "ATTENDING");
    assert.ok(!html.includes("QA EVENT DRAFT SECRET"));
    if (response === "ATTENDING") attendingCookie = guestCookie;
  }
  assert.equal(
    (await json(path, { cookie })).events.find((event) => event.type === "MUHURTHAM").startsAt,
    "2027-01-19T12:30:00.000Z",
  );
  await json(`${path}/MUHURTHAM`, {
    method: "PUT",
    cookie,
    body: { ...published, enabled: false },
  });
  assert.equal((await json(publicPath, { cookie: attendingCookie })).events.length, 0);
  const editor = await call("/dashboard/events", { cookie });
  assert.equal(editor.status, 200);
  assert.ok((await editor.text()).includes("Wedding events"));
  console.log(
    "PASS: four default cards, draft persistence, publish validation, membership protection, independent wedding date, IST conversion, RSVP access, hidden drafts, unpublishing, and editor rendering.",
  );
  if (keep) {
    await mkdir(".local", { recursive: true });
    await writeFile(
      ".local/event-check.json",
      JSON.stringify({
        userIds: users.map((user) => String(user._id)),
        wedding,
        email: users[0].email,
        password,
        cookie,
        attendingCookie,
      }),
    );
    console.log("Disposable browser fixture saved locally.");
  }
  completed = true;
} finally {
  if (!keep || !completed) {
    if (wedding) {
      await EventModel.deleteMany({ weddingId: wedding.id });
      await GuestInvitationModel.deleteMany({ weddingId: wedding.id });
      await WeddingMemberModel.deleteMany({ weddingId: wedding.id });
      await WeddingModel.deleteOne({ _id: wedding.id });
    }
    for (const user of users) {
      await AuthSessionModel.deleteMany({ userId: user._id });
      await UserModel.deleteOne({ _id: user._id });
    }
  }
  await mongoose.disconnect();
}
