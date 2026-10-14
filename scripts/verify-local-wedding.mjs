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
    "PASS: local wedding creation, read, membership, access control, and one active wedding rule.",
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
