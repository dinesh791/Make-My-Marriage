import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { getAuthEnv } from "@/lib/env/env";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { AppError } from "@/lib/http/errors";
import * as repository from "./auth.repository";
import { toUserDto } from "./auth.dto";
import type { LoginInput, RegisterInput } from "./auth.validators";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const DAY = 24 * 60 * 60 * 1000;
let dummyPasswordHash: Promise<string> | undefined;

export function hashAuthValue(value: string) {
  return createHmac("sha256", getAuthEnv().AUTH_SECRET).update(value).digest("hex");
}

function tokenHash(token: string | undefined) {
  return token && TOKEN_PATTERN.test(token) ? hashAuthValue(`session:${token}`) : undefined;
}

function newSession(remember: boolean) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: tokenHash(token)!,
    expiresAt: new Date(Date.now() + (remember ? 30 : 1) * DAY),
    remember,
  };
}

export async function enforceAuthLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const end = (bucket + 1) * windowMs;
  const attempts = await repository.incrementAuthLimit(
    hashAuthValue(`limit:${key}:${bucket}`),
    new Date(end + 60_000),
  );
  if (attempts > limit) {
    throw new AppError("RATE_LIMITED", "Too many attempts. Please try again later.", 429, {
      retryAfter: Math.ceil((end - now) / 1000),
    });
  }
}

export async function register(input: RegisterInput, previousToken?: string) {
  await enforceAuthLimit(`register:email:${input.email}`, 5, 15 * 60_000);
  const session = newSession(false);
  const { password, ...profile } = input;
  const passwordHash = await hashPassword(password);
  try {
    const user = await repository.createAccount(
      { ...profile, passwordHash },
      { tokenHash: session.tokenHash, expiresAt: session.expiresAt },
      tokenHash(previousToken),
    );
    return { user: toUserDto(user), session };
  } catch (error) {
    if (repository.isDuplicateKey(error)) {
      throw new AppError(
        "AUTH_EMAIL_UNAVAILABLE",
        "This email cannot be used to create an account. Try signing in.",
        409,
      );
    }
    throw error;
  }
}

export async function login(input: LoginInput, previousToken?: string) {
  await enforceAuthLimit(`login:email:${input.email}`, 10, 15 * 60_000);
  const user = await repository.findLoginUser(input.email);
  // Unknown/Google-only accounts still do password work, avoiding a fast user-enumeration path.
  const comparisonHash =
    user?.passwordHash ??
    (await (dummyPasswordHash ??= hashPassword(randomBytes(32).toString("hex"))));
  const passwordMatches = await verifyPassword(comparisonHash, input.password);
  if (!user || !user.passwordHash || user.status !== "ACTIVE" || !passwordMatches) {
    throw new AppError("AUTH_INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
  }
  const session = newSession(input.remember);
  await repository.saveSession(
    user._id,
    { tokenHash: session.tokenHash, expiresAt: session.expiresAt },
    tokenHash(previousToken),
  );
  return { user: toUserDto(user), session };
}

export async function getCurrentUser(token: string | undefined) {
  const hash = tokenHash(token);
  if (!hash) return null;
  const user = await repository.findSessionUser(hash, new Date());
  return user ? toUserDto(user) : null;
}

export async function logout(token: string | undefined) {
  const hash = tokenHash(token);
  if (hash) await repository.deleteSession(hash);
}
