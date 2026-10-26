// Checks the saved wedding flow against the local development replica set.
// Only its uniquely named temporary account, session and wedding are removed.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import nextEnv from "@next/env";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user.ts";
import { AuthSessionModel } from "../src/models/auth-session.ts";
import { WeddingModel } from "../src/models/wedding.ts";
import { WeddingMemberModel } from "../src/models/wedding-member.ts";
import { EventModel } from "../src/models/event.ts";
import { verifyServerDatabase } from "./verify-server-database.mjs";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const base = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
const database = new URL(process.env.MONGODB_URI ?? "mongodb://invalid/");
if (
  !["localhost", "127.0.0.1"].includes(base.hostname) ||
  database.hostname !== "127.0.0.1" ||
  database.port !== "27018" ||
  database.pathname !== "/makemymarriage_dev"
) {
  console.error(
    "Refusing wedding check: the app and database must both be local development instances.",
  );
  process.exit(1);
}

const email = `wedding-check-${randomBytes(12).toString("hex")}@example.invalid`;
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
    serverSelectionTimeoutMS: 3_000,
  });
  step = "server database identity";
  await verifyServerDatabase(base);
  step = "register";
  const registered = await call("/api/v1/auth/register", {
    method: "POST",
    body: { firstName: "Wedding Check", email, password },
  });
  assert.equal(registered.status, 201);
  const cookie = registered.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);

  step = "create wedding";
  const created = await call("/api/v1/weddings", {
    method: "POST",
    cookie,
    body: {
      title: "Local Test Wedding",
      role: "BRIDE",
      weddingDate: "2027-01-20T00:00:00.000Z",
      venueName: "Local Test Venue",
      venueAddress: "Salem, Tamil Nadu",
    },
  });
  assert.equal(created.status, 201);
  const { wedding } = (await created.json()).data;
  assert.equal(wedding.title, "Local Test Wedding");

  step = "create custom event";
  const eventDraft = {
    title: "Local Test Mehendi",
    startsAt: null,
    endsAt: null,
    venueName: null,
    address: null,
    mapsUrl: null,
    description: null,
    enabled: false,
  };
  const eventCreated = await call(`/api/v1/weddings/${wedding.id}/events`, {
    method: "POST",
    cookie,
    body: eventDraft,
  });
  assert.equal(eventCreated.status, 200);
  const customEvent = (await eventCreated.json()).data.event;
  assert.equal(customEvent.title, "Local Test Mehendi");
  assert.equal(customEvent.enabled, false);
  assert.match(customEvent.type, /^CUSTOM_/);

  step = "create visible custom event";
  const visibleCreated = await call(`/api/v1/weddings/${wedding.id}/events`, {
    method: "POST",
    cookie,
    body: {
      ...eventDraft,
      title: "Local Test Welcome Dinner",
      startsAt: "2027-01-17T12:00:00.000Z",
      enabled: true,
    },
  });
  const visibleResult = await visibleCreated.json();
  assert.equal(visibleCreated.status, 200);
  assert.equal(visibleResult.data.event.enabled, true);
  const missingDate = await call(`/api/v1/weddings/${wedding.id}/events`, {
    method: "POST",
    cookie,
    body: { ...eventDraft, title: "Invalid Visible Event", enabled: true },
  });
  assert.equal(missingDate.status, 422);

  step = "edit custom event";
  const eventEdited = await call(`/api/v1/weddings/${wedding.id}/events/custom/${customEvent.id}`, {
    method: "PATCH",
    cookie,
    body: {
      ...eventDraft,
      title: "Local Test Sangeet",
      startsAt: "2027-01-19T12:00:00.000Z",
      enabled: true,
    },
  });
  assert.equal(eventEdited.status, 200);
  assert.equal((await eventEdited.json()).data.event.title, "Local Test Sangeet");
  const eventList = await call(`/api/v1/weddings/${wedding.id}/events`, { cookie });
  assert.equal(eventList.status, 200);
  assert.ok((await eventList.json()).data.events.some((event) => event.id === customEvent.id));

  step = "delete custom event";
  const eventDeleted = await call(
    `/api/v1/weddings/${wedding.id}/events/custom/${customEvent.id}`,
    { method: "DELETE", cookie },
  );
  assert.equal(eventDeleted.status, 200);
  const afterDelete = await call(`/api/v1/weddings/${wedding.id}/events`, { cookie });
  assert.equal(afterDelete.status, 200);
  assert.ok(!(await afterDelete.json()).data.events.some((event) => event.id === customEvent.id));
  const deletedRecord = await EventModel.findById(customEvent.id).lean();
  assert.ok(deletedRecord?.deletedAt);
  assert.equal(deletedRecord?.enabled, false);

  step = "keep custom event order after deletion";
  const laterCreated = await call(`/api/v1/weddings/${wedding.id}/events`, {
    method: "POST",
    cookie,
    body: { ...eventDraft, title: "Local Test Farewell" },
  });
  assert.equal(laterCreated.status, 200);
  const laterEvent = (await laterCreated.json()).data.event;
  assert.ok(laterEvent.sortOrder > visibleResult.data.event.sortOrder);
  const orderedList = await call(`/api/v1/weddings/${wedding.id}/events`, { cookie });
  assert.equal(orderedList.status, 200);
  const customIds = (await orderedList.json()).data.events
    .filter((event) => event.type.startsWith("CUSTOM_"))
    .map((event) => event.id);
  assert.deepEqual(customIds, [visibleResult.data.event.id, laterEvent.id]);

  step = "delete predefined event";
  const defaultDeleted = await call(`/api/v1/weddings/${wedding.id}/events/ENGAGEMENT`, {
    method: "DELETE",
    cookie,
  });
  assert.equal(defaultDeleted.status, 200);
  const afterDefaultDelete = await call(`/api/v1/weddings/${wedding.id}/events`, { cookie });
  assert.equal(afterDefaultDelete.status, 200);
  assert.ok(
    !(await afterDefaultDelete.json()).data.events.some((event) => event.type === "ENGAGEMENT"),
  );
  const defaultTombstone = await EventModel.findOne({ weddingId: wedding.id, type: "ENGAGEMENT" });
  assert.ok(defaultTombstone?.deletedAt);
  const defaultDeletedAgain = await call(`/api/v1/weddings/${wedding.id}/events/ENGAGEMENT`, {
    method: "DELETE",
    cookie,
  });
  assert.equal(defaultDeletedAgain.status, 200);
  assert.equal(await EventModel.countDocuments({ weddingId: wedding.id, type: "ENGAGEMENT" }), 1);

  step = "delete saved predefined event";
  const defaultSaved = await call(`/api/v1/weddings/${wedding.id}/events/NALANGU`, {
    method: "PUT",
    cookie,
    body: {
      startsAt: "2027-01-18T12:00:00.000Z",
      endsAt: null,
      venueName: null,
      address: null,
      mapsUrl: null,
      description: null,
      enabled: true,
    },
  });
  assert.equal(defaultSaved.status, 200);
  const savedDefaultDeleted = await call(`/api/v1/weddings/${wedding.id}/events/NALANGU`, {
    method: "DELETE",
    cookie,
  });
  assert.equal(savedDefaultDeleted.status, 200);
  const savedDefaultRecord = await EventModel.findOne({ weddingId: wedding.id, type: "NALANGU" });
  assert.ok(savedDefaultRecord?.deletedAt);
  assert.equal(savedDefaultRecord?.enabled, false);
  const savedDefaultDeletedAgain = await call(`/api/v1/weddings/${wedding.id}/events/NALANGU`, {
    method: "DELETE",
    cookie,
  });
  assert.equal(savedDefaultDeletedAgain.status, 200);
  assert.equal(await EventModel.countDocuments({ weddingId: wedding.id, type: "NALANGU" }), 1);
  const defaultRecreated = await call(`/api/v1/weddings/${wedding.id}/events/NALANGU`, {
    method: "PUT",
    cookie,
    body: {
      startsAt: null,
      endsAt: null,
      venueName: null,
      address: null,
      mapsUrl: null,
      description: null,
      enabled: false,
    },
  });
  assert.equal(defaultRecreated.status, 200);
  const recreatedDeleted = await call(`/api/v1/weddings/${wedding.id}/events/NALANGU`, {
    method: "DELETE",
    cookie,
  });
  assert.equal(recreatedDeleted.status, 200);
  assert.equal(
    await EventModel.countDocuments({ weddingId: wedding.id, type: "NALANGU", deletedAt: null }),
    0,
  );
  assert.equal(await EventModel.countDocuments({ weddingId: wedding.id, type: "NALANGU" }), 2);
  assert.equal(
    (await call(`/api/v1/weddings/${wedding.id}/events/RECEPTION`, { method: "DELETE" })).status,
    401,
  );

  step = "read wedding";
  const list = await call("/api/v1/weddings", { cookie });
  assert.equal(list.status, 200);
  assert.equal((await list.json()).data.wedding.id, wedding.id);
  const detail = await call(`/api/v1/weddings/${wedding.id}`, { cookie });
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).data.wedding.id, wedding.id);

  step = "membership and one wedding rule";
  assert.equal(
    await WeddingMemberModel.countDocuments({ weddingId: wedding.id, status: "ACTIVE" }),
    1,
  );
  const duplicate = await call("/api/v1/weddings", {
    method: "POST",
    cookie,
    body: {
      title: "Another Wedding",
      role: "BRIDE",
      weddingDate: "2027-02-20T00:00:00.000Z",
      venueName: "Another Venue",
      venueAddress: "Salem, Tamil Nadu",
    },
  });
  assert.equal(duplicate.status, 409);
  assert.equal((await call(`/api/v1/weddings/${wedding.id}`)).status, 401);
  console.log(
    "PASS: local wedding creation, custom and predefined event deletion, membership, access control, and one active wedding rule.",
  );
} catch {
  console.error(
    step === "server database identity"
      ? "FAIL: start or restart the local app so it uses the same configured development database."
      : `FAIL at ${step}. Sensitive diagnostics suppressed.`,
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
        await WeddingMemberModel.deleteMany({ userId: user._id });
        await EventModel.deleteMany({ weddingId: { $in: weddingIds } });
        await WeddingModel.deleteMany({ _id: { $in: weddingIds } });
        await AuthSessionModel.deleteMany({ userId: user._id });
        await UserModel.deleteOne({ _id: user._id });
        console.log("Temporary local wedding and account removed.");
      }
    } catch {
      console.error("Temporary local wedding cleanup failed; inspect wedding-check records.");
      process.exitCode = 1;
    }
  }
  await mongoose.disconnect();
}
