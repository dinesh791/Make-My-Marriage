export function guestAccessCookieName(weddingId: string) {
  return `${process.env.NODE_ENV === "production" ? "__Host-" : ""}mmm_guest_${weddingId}`;
}
export const guestAccessCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
