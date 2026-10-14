// Prove the running app reads the same database as the integration script
// before the script sends registration or wedding creation requests.
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { UserModel } from "../src/models/user.ts";
import { AuthSessionModel } from "../src/models/auth-session.ts";

export async function verifyServerDatabase(base) {
  const secret = process.env.AUTH_SECRET;
  assert.ok(secret && secret.length >= 32, "AUTH_SECRET is required for the database check.");
  const token = randomBytes(32).toString("base64url");
  const email = `database-check-${randomBytes(12).toString("hex")}@example.invalid`;
  const tokenHash = createHmac("sha256", secret).update(`session:${token}`).digest("hex");
  let user;
  try {
    user = await UserModel.create({ email, firstName: "Database Check" });
    await AuthSessionModel.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    const response = await fetch(new URL("/api/v1/auth/me", base), {
      headers: { cookie: `mmm_session=${token}` },
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    assert.equal(response.status, 200, "The running app is not using the configured database.");
    assert.equal((await response.json()).data.user.email, email);
  } finally {
    if (user) {
      await AuthSessionModel.deleteMany({ userId: user._id });
      await UserModel.deleteOne({ _id: user._id });
    }
  }
}
