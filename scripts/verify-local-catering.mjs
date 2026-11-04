// Checks the saved wedding flow against the local development replica set.
// Only its uniquely named temporary account, session and wedding are removed.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { CateringModel } from "../src/models/catering.ts";
import nextEnv from "@next/env";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user.ts";
import { AuthSessionModel } from "../src/models/auth-session.ts";
import { WeddingModel } from "../src/models/wedding.ts";
import { WeddingMemberModel } from "../src/models/wedding-member.ts";
import { EventModel } from "../src/models/event.ts";
import { ShoppingItemModel } from "../src/models/shopping-item.ts";
import { GalleryAlbumModel } from "../src/models/gallery-album.ts";
import { GalleryPhotoModel } from "../src/models/gallery-photo.ts";
import { GuestInvitationModel } from "../src/models/guest-invitation.ts";
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

  step = "catering";
  const path = "/api/v1/weddings/" + wedding.id + "/catering";
  assert.equal((await call(path)).status, 401);
  assert.equal((await (await call(path, { cookie })).json()).data.catering, null);
  const input = { foodType: "VEGETARIAN", breakfast: "Idli\nPongal", notes: "No onion" };
  assert.equal((await call(path, { method: "PUT", cookie, body: input })).status, 200);
  assert.equal(
    (await (await call(path, { cookie })).json()).data.catering.breakfast,
    input.breakfast,
  );
  assert.equal(
    (await call(path, { method: "PUT", cookie, body: { foodType: "invalid" } })).status,
    422,
  );
  assert.equal(
    (await call("/api/v1/weddings/" + new mongoose.Types.ObjectId() + "/catering", { cookie }))
      .status,
    404,
  );
  const page = await call("/dashboard/catering", { cookie });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Edit menu/);
  assert.equal(
    (await call(path, { method: "PUT", cookie, body: { ...input, breakfast: "Dosa" } })).status,
    200,
  );
  assert.equal(await CateringModel.countDocuments({ weddingId: wedding.id, deletedAt: null }), 1);
  assert.equal((await call(path, { method: "DELETE", cookie })).status, 200);
  assert.equal((await (await call(path, { cookie })).json()).data.catering, null);
  assert.equal((await call(path, { method: "PUT", cookie, body: input })).status, 200);
  assert.equal(await CateringModel.countDocuments({ weddingId: wedding.id }), 2);
  console.log(
    "PASS: Catering persistence, validation, privacy, page rendering, soft delete and recreation.",
  );
} catch (error) {
  console.error(
    step === "server database identity"
      ? `FAIL: start or restart the local app so it uses the same configured development database.${error instanceof assert.AssertionError ? ` ${error.message}` : ""}`
      : `FAIL at ${step} (${error?.name}). ${error instanceof assert.AssertionError && typeof error.actual === "number" ? `Expected ${error.expected}, received ${error.actual}.` : "Sensitive diagnostics suppressed."}`,
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
        await CateringModel.deleteMany({ weddingId: { $in: weddingIds } });
        await ShoppingItemModel.deleteMany({ weddingId: { $in: weddingIds } });
        await GalleryPhotoModel.deleteMany({ weddingId: { $in: weddingIds } });
        await GuestInvitationModel.deleteMany({ weddingId: { $in: weddingIds } });
        await GalleryAlbumModel.deleteMany({ weddingId: { $in: weddingIds } });
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
