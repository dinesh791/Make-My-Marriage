import { Resend } from "resend";
import { getEmailEnv } from "@/lib/env/env";

let client: Resend | undefined;
export function getEmailClient() {
  if (!client) client = new Resend(getEmailEnv().RESEND_API_KEY);
  return client;
}
export function getEmailFromAddress() {
  return getEmailEnv().EMAIL_FROM;
}
