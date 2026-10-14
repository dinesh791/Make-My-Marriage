import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/auth.service";
import { SESSION_COOKIE_NAME } from "./session";

export const currentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  try {
    return await getCurrentUser(token);
  } catch {
    // Keep driver/configuration diagnostics out of rendered errors and server logs.
    throw new Error("The account service is temporarily unavailable. Please try again.");
  }
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
