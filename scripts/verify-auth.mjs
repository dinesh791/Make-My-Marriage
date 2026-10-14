// Opt-in integration check: creates temporary accounts ONLY in makemymarriage_dev,
// exercises the running local app, then removes only its own users and sessions.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import nextEnv from "@next/env";
import mongoose from "mongoose";
import argon2 from "argon2";
import { UserModel } from "../src/models/user.ts";
import { AuthSessionModel } from "../src/models/auth-session.ts";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const base = new URL(
  process.env.AUTH_TEST_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
);
const uri = process.env.MONGODB_URI;
let developmentDatabase = false;
try { developmentDatabase = Boolean(uri && new URL(uri).pathname === "/makemymarriage_dev"); } catch { /* Invalid URI: fail without printing it. */ }
if (
  !developmentDatabase ||
  !["localhost", "127.0.0.1"].includes(base.hostname)
) {
  console.error(
    "Refusing integration check: requires makemymarriage_dev and a local application URL.",
  );
  process.exit(1);
}
const suffix = randomBytes(12).toString("hex");
const emails = [
  `auth-check-${suffix}@example.invalid`,
  `auth-check-other-${suffix}@example.invalid`,
  `auth-check-race-${suffix}@example.invalid`,
];
const password = randomBytes(24).toString("base64url");
const createdIds = [];
let step = "connect";
let completed = false;

async function call(
  path,
  {
    body,
    cookie,
    method = "GET",
    origin = base.origin,
    rawBody,
    contentType = "application/json",
  } = {},
) {
  const headers = { origin };
  if (cookie) headers.cookie = cookie;
  if (body !== undefined || rawBody !== undefined) headers["content-type"] = contentType;
  return fetch(new URL(path, base), {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
    redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });
}
function cookieFrom(response) {
  const header = response.headers.get("set-cookie");
  assert.ok(header?.includes("HttpOnly"));
  assert.ok(/SameSite=Lax/i.test(header));
  assert.ok(header.includes("Path=/"));
  return header.split(";")[0];
}
function expectStatus(response, status) {
  assert.equal(response.status, status, `Unexpected response status at ${step}`);
}

try {
  await mongoose.connect(uri, {
    autoCreate: false,
    autoIndex: false,
    serverSelectionTimeoutMS: 10_000,
  });
  step = "anonymous access";
  expectStatus(await call("/api/v1/auth/me"), 401);
  const anonymousDashboard = await call("/dashboard");
  expectStatus(anonymousDashboard, 307);
  assert.ok(anonymousDashboard.headers.get("location")?.endsWith("/login"));

  step = "origin and request validation";
  expectStatus(
    await call("/api/v1/auth/register", {
      method: "POST",
      body: {},
      origin: "https://untrusted.example",
    }),
    403,
  );
  expectStatus(await call("/api/v1/auth/register", { method: "POST", rawBody: "{" }), 400);
  expectStatus(
    await call("/api/v1/auth/register", { method: "POST", rawBody: "x".repeat(8193) }),
    413,
  );
  expectStatus(
    await call("/api/v1/auth/register", {
      method: "POST",
      body: { firstName: "Test", email: emails[0], password: "short" },
    }),
    422,
  );

  step = "registration";
  const registration = await call("/api/v1/auth/register", {
    method: "POST",
    body: { firstName: "Auth Check", email: emails[0].toUpperCase(), password },
  });
  expectStatus(registration, 201);
  let cookie = cookieFrom(registration);
  assert.ok(!/Expires=|Max-Age=/i.test(registration.headers.get("set-cookie")));
  const registered = await registration.json();
  assert.equal(registered.data.user.email, emails[0]);
  assert.deepEqual(Object.keys(registered.data.user).sort(), [
    "email",
    "firstName",
    "id",
    "lastName",
    "locale",
  ]);
  const stored = await UserModel.findOne({ email: emails[0] }).select("+passwordHash");
  assert.ok(stored);
  createdIds.push(stored._id);
  assert.ok(await argon2.verify(stored.passwordHash, password));
  const session = await AuthSessionModel.findOne({ userId: stored._id }).select("+tokenHash");
  assert.ok(session);
  assert.ok(session.tokenHash !== cookie.split("=")[1]);
  expectStatus(await call("/api/v1/auth/me", { cookie }), 200);
  const dashboard = await call("/dashboard", { cookie });
  expectStatus(dashboard, 200);
  assert.ok((await dashboard.text()).includes("Auth Check"));
  expectStatus(await call("/login", { cookie }), 307);

  step = "duplicate email and sparse Google index";
  expectStatus(
    await call("/api/v1/auth/register", {
      method: "POST",
      body: { firstName: "Duplicate", email: emails[0], password },
    }),
    409,
  );
  const other = await call("/api/v1/auth/register", {
    method: "POST",
    body: { firstName: "Second", email: emails[1], password },
  });
  expectStatus(other, 201);
  const otherUser = await UserModel.findOne({ email: emails[1] });
  assert.ok(otherUser);
  createdIds.push(otherUser._id);

  step = "concurrent duplicate registration";
  const racing = await Promise.all([0, 1].map(() => call("/api/v1/auth/register", {
    method: "POST", body: { firstName: "Concurrent", email: emails[2], password },
  })));
  assert.deepEqual(racing.map(response => response.status).sort(), [201, 409]);
  assert.equal(await UserModel.countDocuments({ email: emails[2] }), 1);

  step = "logout revocation";
  const logout = await call("/api/v1/auth/logout", { method: "POST", cookie });
  expectStatus(logout, 200);
  assert.ok(/Max-Age=0/i.test(logout.headers.get("set-cookie")));
  expectStatus(await call("/api/v1/auth/me", { cookie }), 401);

  step = "wrong password and persistent login";
  expectStatus(
    await call("/api/v1/auth/login", {
      method: "POST",
      body: { email: emails[0], password: "not the right password" },
    }),
    401,
  );
  const signedIn = await call("/api/v1/auth/login", {
    method: "POST",
    body: { email: emails[0], password, remember: true },
  });
  expectStatus(signedIn, 200);
  cookie = cookieFrom(signedIn);
  assert.ok(/Expires=/i.test(signedIn.headers.get("set-cookie")));

  step = "session rotation";
  const previousCookie = cookie;
  const rotated = await call("/api/v1/auth/login", {
    method: "POST",
    cookie,
    body: { email: emails[0], password },
  });
  expectStatus(rotated, 200);
  cookie = cookieFrom(rotated);
  assert.notEqual(cookie, previousCookie);
  expectStatus(await call("/api/v1/auth/me", { cookie: previousCookie }), 401);

  step = "suspension and soft deletion";
  await UserModel.updateOne({ _id: stored._id }, { $set: { status: "SUSPENDED" } });
  expectStatus(await call("/api/v1/auth/me", { cookie }), 401);
  expectStatus(
    await call("/api/v1/auth/login", { method: "POST", body: { email: emails[0], password } }),
    401,
  );
  await UserModel.updateOne(
    { _id: stored._id },
    { $set: { status: "ACTIVE", deletedAt: new Date() } },
  );
  expectStatus(await call("/api/v1/auth/me", { cookie }), 401);
  expectStatus(
    await call("/api/v1/auth/register", {
      method: "POST",
      body: { firstName: "Reserved", email: emails[0], password },
    }),
    409,
  );
  await UserModel.updateOne({ _id: stored._id }, { $set: { deletedAt: null } });

  step = "expiry before TTL cleanup";
  await AuthSessionModel.updateMany(
    { userId: stored._id },
    { $set: { expiresAt: new Date(Date.now() - 1000) } },
  );
  expectStatus(await call("/api/v1/auth/me", { cookie }), 401);
  expectStatus(await call("/api/v1/auth/me", { cookie: "mmm_session=forged" }), 401);

  step = "distributed login limit";
  let rateResponse;
  for (let attempt = 0; attempt < 11; attempt++) {
    rateResponse = await call("/api/v1/auth/login", {
      method: "POST",
      body: { email: emails[0], password: "incorrect password" },
    });
    if (rateResponse.status === 429) break;
    expectStatus(rateResponse, 401);
  }
  expectStatus(rateResponse, 429);
  assert.ok(Number(rateResponse.headers.get("retry-after")) > 0);
  completed = true;
  console.log(
    "PASS: registration, duplicate identities, login, cookies, session rotation/revocation/expiry, protected dashboard, account status, request validation and rate limiting.",
  );
} catch {
  // Avoid printing assertions containing cookies, account records, or database diagnostics.
  console.error(`FAIL at ${step}. Sensitive diagnostics suppressed.`);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState === 1) {
    try {
      const owned = await UserModel.find({ email: { $in: emails } })
        .select("_id")
        .lean();
      const ids = [...createdIds, ...owned.map((user) => user._id)];
      await AuthSessionModel.deleteMany({ userId: { $in: ids } });
      await UserModel.deleteMany({ email: { $in: emails } });
      console.log(
        "Temporary test accounts and their sessions removed. Short-lived rate counters expire automatically.",
      );
    } catch {
      console.error(
        "Temporary account cleanup failed; inspect auth-check accounts before retrying.",
      );
      process.exitCode = 1;
    }
  }
  await mongoose.disconnect();
}
if (!completed) process.exitCode = 1;
