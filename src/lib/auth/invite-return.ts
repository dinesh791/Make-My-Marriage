export function safeInviteReturn(value: string | string[] | undefined) {
  const path = typeof value === "string" ? value : undefined;
  return path && /^\/partner-invite\/[A-Za-z0-9_-]{43}$/.test(path) ? path : null;
}
