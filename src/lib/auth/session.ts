export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-mmm_session" : "mmm_session";
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
export type AuthenticatedSession = { userId: string; expiresAt: Date };
