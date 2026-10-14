import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import { NextRequest } from "next/server";
import { registerSchema, loginSchema } from "../../../src/modules/auth/auth.validators";
import { readAuthJson, requireSameOrigin } from "../../../src/lib/http/auth-request";
import { UserModel, userSchema } from "../../../src/models/user";
import { AuthSessionModel } from "../../../src/models/auth-session";
import { hashPassword, verifyPassword } from "../../../src/lib/auth/password";

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  createAccount: vi.fn(),
  findLoginUser: vi.fn(),
  saveSession: vi.fn(),
  findSessionUser: vi.fn(),
  deleteSession: vi.fn(),
  incrementAuthLimit: vi.fn(),
  isDuplicateKey: (error: { code?: number }) => error.code === 11000,
}));
import * as repository from "../../../src/modules/auth/auth.repository";
import * as service from "../../../src/modules/auth/auth.service";
import { authController } from "../../../src/modules/auth/auth.controller";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AUTH_SECRET", "unit-test-secret-not-for-production-00000000");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.mocked(repository.incrementAuthLimit).mockResolvedValue(1);
});

describe("account validation and storage", () => {
  it("normalizes identity without changing the password, and forbids role/status injection", () => {
    const input = {
      firstName: " Dinesh ",
      email: " DINESH@Example.com ",
      password: " a long passphrase ",
    };
    expect(registerSchema.parse(input)).toMatchObject({
      firstName: "Dinesh",
      email: "dinesh@example.com",
      password: input.password,
    });
    expect(registerSchema.safeParse({ ...input, status: "ACTIVE", role: "GROOM" }).success).toBe(
      false,
    );
    expect(registerSchema.safeParse({ ...input, password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: { $ne: null }, password: "anything" }).success).toBe(
      false,
    );
  });

  it("does not index absent Google identities as null and hides password fields by default", () => {
    const user = new UserModel({ email: "USER@EXAMPLE.COM", firstName: "User" });
    expect(user.email).toBe("user@example.com");
    expect(user.googleSubject).toBeUndefined();
    expect(userSchema.path("passwordHash").options.select).toBe(false);
    expect(userSchema.indexes()).toContainEqual([
      { email: 1 },
      expect.objectContaining({ unique: true }),
    ]);
    expect(AuthSessionModel.schema.indexes()).toContainEqual([
      { expiresAt: 1 },
      expect.objectContaining({ expireAfterSeconds: 0 }),
    ]);
  });

  it("stores a salted Argon2id password hash and rejects a wrong password", async () => {
    const hash = await hashPassword("a good long passphrase");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, "a good long passphrase")).toBe(true);
    expect(await verifyPassword(hash, "a wrong long passphrase")).toBe(false);
  });
});

describe("request security", () => {
  it("rejects missing, foreign and opaque origins even if the Host header is forged", () => {
    for (const origin of [undefined, "https://evil.example", "null"]) {
      const headers: Record<string, string> = { host: "evil.example" };
      if (origin) headers.origin = origin;
      expect(() => requireSameOrigin(new Request("http://localhost:3000", { headers }))).toThrow();
    }
    expect(() =>
      requireSameOrigin(
        new Request("http://localhost:3000", { headers: { origin: "http://localhost:3000" } }),
      ),
    ).not.toThrow();
  });

  it("rejects invalid JSON, oversized bodies and non-JSON content types", async () => {
    const request = (body: string, contentType = "application/json") =>
      new Request("http://localhost:3000", {
        method: "POST",
        body,
        headers: { "content-type": contentType },
      });
    await expect(readAuthJson(request("{"), registerSchema)).rejects.toMatchObject({ status: 400 });
    await expect(readAuthJson(request("x".repeat(8193)), registerSchema)).rejects.toMatchObject({
      status: 413,
    });
    await expect(readAuthJson(request("{}", "text/plain"), registerSchema)).rejects.toMatchObject({
      status: 415,
    });
  });

  it("returns private error envelopes without leaking database diagnostics", async () => {
    vi.mocked(repository.incrementAuthLimit).mockRejectedValue(new Error("mongodb+srv://SECRET"));
    const request = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    const response = await authController(request, "login");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).not.toContain("SECRET");
  });
});

describe("sessions and authentication", () => {
  it("rejects malformed tokens before accessing MongoDB and passes an explicit expiry cutoff", async () => {
    expect(await service.getCurrentUser("forged")).toBeNull();
    expect(repository.findSessionUser).not.toHaveBeenCalled();
    vi.mocked(repository.findSessionUser).mockResolvedValue(null);
    const token = "A".repeat(43);
    expect(await service.getCurrentUser(token)).toBeNull();
    expect(repository.findSessionUser).toHaveBeenCalledWith(
      service.hashAuthValue(`session:${token}`),
      expect.any(Date),
    );
  });

  it("revokes the hashed token on logout", async () => {
    const token = "A".repeat(43);
    await service.logout(token);
    expect(repository.deleteSession).toHaveBeenCalledWith(
      service.hashAuthValue(`session:${token}`),
    );
  });

  it("creates an account/session without saving plaintext password or token and returns a safe DTO", async () => {
    const user = new UserModel({
      firstName: "Dinesh",
      email: "dinesh@example.com",
      _id: new Types.ObjectId(),
    });
    vi.mocked(repository.createAccount).mockResolvedValue(user);
    const result = await service.register(
      registerSchema.parse({
        firstName: "Dinesh",
        email: user.email,
        password: "long enough password",
      }),
    );
    const [storedUser, storedSession] = vi.mocked(repository.createAccount).mock.calls[0];
    expect(storedUser).not.toHaveProperty("password");
    expect(storedUser.passwordHash).toMatch(/^\$argon2id\$/);
    expect(storedSession.tokenHash).not.toBe(result.session.token);
    expect(storedSession).not.toHaveProperty("token");
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user).not.toHaveProperty("googleSubject");
    expect(result.session.token).toMatch(/^[\w-]{43}$/);
  });

  it("reports duplicate emails as a conflict", async () => {
    vi.mocked(repository.createAccount).mockRejectedValue({ code: 11000 });
    await expect(
      service.register(
        registerSchema.parse({
          firstName: "User",
          email: "user@example.com",
          password: "long enough password",
        }),
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("stops work when a distributed rate limit is exceeded", async () => {
    vi.mocked(repository.incrementAuthLimit).mockResolvedValue(11);
    await expect(
      service.login(loginSchema.parse({ email: "user@example.com", password: "wrong" })),
    ).rejects.toMatchObject({ status: 429 });
    expect(repository.findLoginUser).not.toHaveBeenCalled();
  });
});
